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
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { RootStackParamList, MediaItem, Video as ServerVideo } from '../types';
import { downscaleVideoIfRequired } from '../utils/ffmpegFilters';
import VideoPlaceholder from '../components/VideoPlaceholder';
import CameraView from '../components/CameraView';
import RecordButton from '../components/RecordButton';
import InfoDisplay from '../components/Common/InfoDisplay';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';

const { AudioSessionModule } = NativeModules;

type RecordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Record'
>;

interface Props {
  navigation: RecordScreenNavigationProp;
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

const RecordScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, 'Record'>>();
  const { video: parentVideo } = route.params;

  useEffect(() => {
    console.log('Parent video data received in RecordScreen:', parentVideo);
  }, [parentVideo]);

  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicrophonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);

  const videoPlayer = useRef<VideoRef>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(
    parentVideo?.video_url || null,
  );
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);

  const checkAndRequestStoragePermission = async (): Promise<boolean> => {
    const androidApiVersion =
      typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version;

    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return result === RESULTS.GRANTED;
    }
    if (androidApiVersion >= 33) {
      const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
      return result === RESULTS.GRANTED;
    }
    const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    return result === RESULTS.GRANTED;
  };

  useEffect(() => {
    const checkPermissions = async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();
      setIsCheckingPermissions(false);
    };
    checkPermissions();

    return () => {
      if (
        Platform.OS === 'ios' &&
        AudioSessionModule &&
        AudioSessionModule.deactivateAudioSession
      ) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, [requestCameraPermission, requestMicrophonePermission]);

  const handleSelectVideo = async () => {
    try {
      if (parentVideo) {
        Alert.alert(
          '알림',
          '이미 합주할 비디오가 선택되어 있습니다. 선택을 변경하시겠습니까?',
          [
            { text: '아니오', style: 'cancel' },
            { text: '예', onPress: () => pickAndProcessVideo() },
          ],
        );
      } else {
        await pickAndProcessVideo();
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        console.log('사용자가 파일 선택을 취소했습니다.');
      } else {
        console.error('동영상 선택 또는 처리 중 에러:', err);
        Alert.alert('오류', '동영상을 불러오는 중 문제가 발생했습니다.');
      }
    }
  };

  const pickAndProcessVideo = async () => {
    try {
      const result = await pick({
        type: [types.video],
        allowMultiSelection: false,
      });
      const pickedUri = result[0]?.uri;
      if (!pickedUri) return;

      setIsEncoding(true);
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
    } finally {
      setIsEncoding(false);
    }
  };

  const handleRecordButtonPress = async () => {
    if (!camera.current) return;

    if (isRecording) {
      try {
        setIsLoading(true);
        await camera.current.stopRecording();
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
        Alert.alert('오류', '녹화 중지 중 문제가 발생했습니다.');
        setIsLoading(false);
      }
      return;
    }

    const hasStoragePermission = await checkAndRequestStoragePermission();
    if (!hasStoragePermission) {
      return;
    }

    if (!selectedVideoUri) {
      Alert.alert('알림', '먼저 합주할 배경 비디오를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);

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
          setIsLoading(false);
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
              '영상이 갤러리에 저장되었으며, 편집을 위해 준비 중입니다...',
            );

            if (!parentVideo) {
              Alert.alert('오류', '원본 비디오 정보가 없습니다.');
              return;
            }

            let sourceItems: ServerVideo[] = [];
            try {
              const response = await axiosInstance.get<ServerVideo[]>(
                `videos/${parentVideo.id}/lineage`,
              );
              sourceItems = response.data;
            } catch (err) {
              console.error(
                '[RecordScreen] Failed to fetch video lineage:',
                err,
              );
              Alert.alert('오류', '합주 정보를 불러오는 데 실패했습니다.');
              return;
            }

            const recordedVideo: MediaItem = {
              id: video.path,
              uri: video.path,
              filename: 'recorded_video.mp4',
              type: 'video',
              size: 0,
            };

            navigation.replace('Processing', {
              localVideos: [recordedVideo],
              sourceVideos: sourceItems,
              parentVideoId: parentVideo.id,
            });
          } catch (saveError) {
            console.error('영상 저장/처리 실패:', saveError);
            Alert.alert('오류', '영상을 저장하고 처리하는 데 실패했습니다.');
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

      setIsLoading(false);
      setIsRecording(true);
    } catch (error) {
      console.error('오디오 세션 활성화 또는 녹화 시작 에러:', error);
      Alert.alert('오류', '녹화를 시작하는 중 문제가 발생했습니다.');
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  if (isCheckingPermissions) {
    return (
      <ScreenContainer>
        <InfoDisplay showIndicator={true} message="권한을 확인 중입니다..." />
      </ScreenContainer>
    );
  }
  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <ScreenContainer>
        <InfoDisplay message="합주 녹화를 위해 카메라와 마이크 권한이 필요합니다." />
      </ScreenContainer>
    );
  }
  if (!device) {
    return (
      <ScreenContainer>
        <InfoDisplay message="카메라를 찾을 수 없습니다." />
      </ScreenContainer>
    );
  }

  const videoPlayerProps = Platform.select({
    ios: { mixWithOthers: 'mix' as const, disableAudioSessionManagement: true },
    android: {},
  });

  return (
    <ScreenContainer>
      {isLoading && (
        <LoadingOverlay>
          <InfoDisplay showIndicator={true} message={'준비 중입니다...'} />
        </LoadingOverlay>
      )}

      <TopContainer>
        {selectedVideoUri ? (
          <VideoPlayerStyled
            ref={videoPlayer}
            source={{ uri: selectedVideoUri }}
            paused={isVideoPaused}
            resizeMode="contain"
            repeat={true}
            muted={false}
            {...videoPlayerProps}
          />
        ) : (
          <VideoPlaceholder
            isEncoding={isEncoding}
            onSelectVideo={handleSelectVideo}
          />
        )}
      </TopContainer>

      <CameraView cameraRef={camera} device={device} isActive={true} />

      {selectedVideoUri && (
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordButtonPress}
          disabled={isLoading || isEncoding}
        />
      )}
    </ScreenContainer>
  );
};

export default RecordScreen;
