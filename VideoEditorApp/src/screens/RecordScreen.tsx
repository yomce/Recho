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
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import {
  RootStackParamList,
  MediaItem,
  ServerVideo,
} from '../navigation/types';
import { downscaleVideoIfRequired } from '../utils/ffmpegFilters';
import VideoPlaceholder from '../components/VideoPlaceholder';
import CameraView from '../components/CameraView';
import RecordButton from '../components/RecordButton';
import InfoDisplay from '../components/Common/InfoDisplay';
import axiosInstance from '../api/axiosInstance';

const { AudioSessionModule } = NativeModules;

type RecordScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'RecordScreen'>;
  route: RouteProp<RootStackParamList, 'RecordScreen'>;
};

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

const RecordScreen: React.FC<RecordScreenProps> = ({ navigation, route }) => {
  const { video: parentVideo } = route.params;

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

  useEffect(() => {
    const checkPermissions = async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();
      setIsCheckingPermissions(false);
    };
    checkPermissions();

    return () => {
      if (Platform.OS === 'ios' && AudioSessionModule?.deactivateAudioSession) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, [requestCameraPermission, requestMicrophonePermission]);

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

    if (!selectedVideoUri) {
      Alert.alert('알림', '먼저 합주할 배경 비디오를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      if (Platform.OS === 'ios' && AudioSessionModule?.activateAudioSession) {
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
            AudioSessionModule?.deactivateAudioSession
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
            AudioSessionModule?.deactivateAudioSession
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
          <InfoDisplay
            message="합주할 비디오를 불러오는 중입니다..."
            showIndicator={true}
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
