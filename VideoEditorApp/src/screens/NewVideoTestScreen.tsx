import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, Platform, NativeModules } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import { pick, types, isErrorWithCode } from '@react-native-documents/picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

import { RootStackParamList, MediaItem } from '../types';
import { downscaleVideoIfRequired } from '../utils/ffmpegFilters';
import VideoPlaceholder from '../components/VideoPlaceholder';
import CameraView from '../components/CameraView';
import RecordButton from '../components/RecordButton';
import InfoDisplay from '../components/Common/InfoDisplay';
import { StackNavigationProp } from '@react-navigation/stack';

const { AudioSessionModule } = NativeModules;

type NewVideoTestScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NewVideoTest'
>;

interface Props {
  navigation: NewVideoTestScreenNavigationProp;
}

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: black;
`;

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10;
  justify-content: center;
  align-items: center;
`;

const TopContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: black;
`;

const VideoPlayerStyled = styled(Video)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const NewVideoTestScreen: React.FC<Props> = ({ navigation }) => {
  // 카메라 및 마이크 권한 상태 확인 훅
  const { hasPermission: hasCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission } = useMicrophonePermission();

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  const videoPlayer = useRef<VideoRef>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false); // 이 상태는 여전히 비디오 선택 중 최적화 로딩을 위해 필요합니다.

  useEffect(() => {
    return () => {
      if (
        Platform.OS === 'ios' &&
        AudioSessionModule &&
        AudioSessionModule.deactivateAudioSession
      ) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, []);

  const handleSelectVideo = async () => {
    try {
      const result = await pick({
        type: [types.video],
        allowMultiSelection: false,
      });
      const pickedUri = result[0]?.uri;
      if (!pickedUri) return;

      setIsEncoding(true); // 비디오 선택 시 인코딩 시작 로딩
      const finalVideoUri = await downscaleVideoIfRequired(pickedUri);

      if (finalVideoUri) {
        setSelectedVideoUri(finalVideoUri);
        videoPlayer.current?.seek(0);
        setIsVideoPaused(true);
      } else {
        setSelectedVideoUri(null);
        console.log(
          '비디오 처리가 취소되었거나 실패하여 선택이 해제되었습니다.',
        );
        Alert.alert(
          '알림',
          '비디오 처리가 실패하거나 취소되었습니다. 다른 비디오를 선택해주세요.',
        );
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        console.log('사용자가 파일 선택을 취소했습니다.');
      } else {
        console.error('동영상 선택 또는 처리 중 에러:', err);
        Alert.alert('오류', '동영상을 불러오는 중 문제가 발생했습니다.');
      }
    } finally {
      setIsEncoding(false); // 비디오 선택 시 인코딩 로딩 종료
    }
  };

  const handleRecordButtonPress = async () => {
    if (!camera.current) return;

    // 권한 확인
    if (!hasCameraPermission || !hasMicrophonePermission) {
      Alert.alert(
        '권한 필요',
        '카메라와 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.',
      );
      return;
    }

    if (isRecording) {
      try {
        setIsLoading(true); // 녹화 중지 전환 시 로딩 시작
        await camera.current.stopRecording();
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
        Alert.alert('오류', '녹화 중지 중 문제가 발생했습니다.');
        setIsLoading(false);
      }
      return;
    }

    if (!selectedVideoUri) {
      Alert.alert('알림', '먼저 합주할 배경 비디오를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true); // 녹화 시작 전환 시 로딩 시작

      if (
        Platform.OS === 'ios' &&
        AudioSessionModule &&
        AudioSessionModule.activateAudioSession
      ) {
        await AudioSessionModule.activateAudioSession();
      }

      videoPlayer.current?.seek(0);
      setIsVideoPaused(false);

      camera.current.startRecording({
        onRecordingFinished: async video => {
          setIsRecording(false);
          setIsLoading(false); // 녹화 완료 후 로딩 해제
          setIsVideoPaused(true);
          if (
            Platform.OS === 'ios' &&
            AudioSessionModule &&
            AudioSessionModule.deactivateAudioSession
          ) {
            AudioSessionModule.deactivateAudioSession();
          }

          try {
            await CameraRoll.save(video.path, { type: 'video' });
            Alert.alert(
              '녹화 완료',
              '영상이 갤러리에 저장되었습니다! 편집 화면으로 이동합니다.',
            );

            const backgroundVideo: MediaItem = {
              id: selectedVideoUri,
              uri: selectedVideoUri,
              filename: 'background_video.mp4',
              type: 'video',
              size: 0,
            };
            const recordedVideo: MediaItem = {
              id: video.path,
              uri: video.path,
              filename: 'recorded_video.mp4',
              type: 'video',
              size: 0,
            };

            navigation.navigate('VideoEdit', {
              localVideos: [backgroundVideo, recordedVideo],
              sourceVideos: [],
            });
          } catch (saveError) {
            console.error('영상 저장 실패:', saveError);
            Alert.alert('오류', '영상을 갤러리에 저장하는 데 실패했습니다.');
          }
        },
        onRecordingError: error => {
          console.error('녹화 중 에러 발생:', error);
          setIsRecording(false);
          setIsLoading(false);
          setIsVideoPaused(true);
          Alert.alert('오류', '녹화 중 문제가 발생했습니다.');
          if (
            Platform.OS === 'ios' &&
            AudioSessionModule &&
            AudioSessionModule.deactivateAudioSession
          ) {
            AudioSessionModule.deactivateAudioSession();
          }
        },
      });

      setIsRecording(true);
    } catch (error) {
      console.error('녹화 시작 에러:', error);
      Alert.alert('오류', '녹화를 시작하는 중 문제가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 권한이 없으면 안내 화면 표시
  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <ScreenContainer>
        <InfoDisplay
          title="권한 필요"
          message="카메라와 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요."
          iconName="camera"
        />
      </ScreenContainer>
    );
  }

  // 카메라 장치가 없으면 안내 화면 표시
  if (!device) {
    return (
      <ScreenContainer>
        <InfoDisplay
          title="카메라 오류"
          message="사용 가능한 카메라를 찾을 수 없습니다."
          iconName="camera-off"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TopContainer>
        {selectedVideoUri ? (
          <VideoPlayerStyled
            ref={videoPlayer}
            source={{ uri: selectedVideoUri }}
            paused={isVideoPaused}
            repeat={true}
            resizeMode="cover"
            muted={true}
          />
        ) : (
          <VideoPlaceholder />
        )}

        <CameraView device={device} cameraRef={camera} />

        {(isLoading || isEncoding) && (
          <LoadingOverlay>
            <InfoDisplay
              title="처리 중"
              message={
                isEncoding
                  ? '비디오를 처리 중입니다...'
                  : isRecording
                  ? '녹화 중...'
                  : '녹화를 준비 중입니다...'
              }
              showIndicator={true}
            />
          </LoadingOverlay>
        )}

        <RecordButton
          isRecording={isRecording}
          isLoading={isLoading || isEncoding}
          onPress={handleRecordButtonPress}
        />
      </TopContainer>
    </ScreenContainer>
  );
};

export default NewVideoTestScreen;
