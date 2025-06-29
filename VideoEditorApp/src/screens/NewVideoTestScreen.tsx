import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  CameraDevice, // CameraDevice 타입을 명시적으로 import
} from 'react-native-vision-camera';
import { pick, types, isErrorWithCode } from '@react-native-documents/picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MediaItem } from '../types';

// Util 함수와 분리된 컴포넌트들을 import
import { downscaleVideoIfRequired } from '../utils/ffmpegFilters';
import VideoPlaceholder from '../components/VideoPlaceholder';
import CameraView from '../components/CameraView';
import RecordButton from '../components/RecordButton';

const { AudioSessionModule } = NativeModules;

type NewVideoTestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewVideoTest'>;

interface Props {
  navigation: NewVideoTestScreenNavigationProp;
}

const NewVideoTestScreen: React.FC<Props> = ({ navigation }) => {
  // --- 상태와 로직 ---
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  const videoPlayer = useRef<VideoRef>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);

  // --- 핸들러 함수와 useEffect ---
  const checkAndRequestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return result === RESULTS.GRANTED;
    }
    if (Platform.Version >= 33) {
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
      if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, [requestCameraPermission, requestMicrophonePermission]);

  const handleSelectVideo = async () => {
    try {
      const result = await pick({
        type: [types.video],
        allowMultiSelection: false,
      });
      const pickedUri = result[0].uri;
      if (!pickedUri) return;
      
      setIsEncoding(true);
      const finalVideoUri = await downscaleVideoIfRequired(pickedUri);
      
      if (finalVideoUri) {
        setSelectedVideoUri(finalVideoUri);
      } else {
        setSelectedVideoUri(null); 
        console.log("비디오 처리가 취소되었거나 실패하여 선택이 해제되었습니다.");
      }
    } catch (err) {
      if (isErrorWithCode(err, 'DOCUMENT_PICKER_CANCELED')) {
        console.log('사용자가 파일 선택 자체를 취소했습니다.');
      } else {
        console.error('동영상 선택 또는 처리 중 에러:', err);
        Alert.alert('오류', '동영상을 불러오는 중 문제가 발생했습니다.');
      }
    } finally {
      setIsEncoding(false);
    }
  };

  const handleRecordButtonPress = async () => {
    if (!camera.current) return;

    if (isRecording) {
      try {
        await camera.current.stopRecording();
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
      }
      return;
    }

    const hasStoragePermission = await checkAndRequestStoragePermission();
    if (!hasStoragePermission) {
        Alert.alert('권한 필요', '영상을 저장하려면 저장 공간 접근 권한이 필요합니다.');
        return;
    }

    try {
      setIsLoading(true);
      if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.activateAudioSession) {
        await AudioSessionModule.activateAudioSession();
      }

      videoPlayer.current?.seek(0);
      setIsVideoPaused(false);
      setIsRecording(true);

      camera.current.startRecording({
        onRecordingFinished: async video => {
          setIsRecording(false);
          if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
            AudioSessionModule.deactivateAudioSession();
          }

          try {
            await CameraRoll.save(video.path, { type: 'video' });
            Alert.alert('녹화 완료', '영상이 갤러리에 저장되었습니다! 편집 화면으로 이동합니다.');
            
            if (selectedVideoUri) {
              const backgroundVideo: MediaItem = {
                id: selectedVideoUri,
                uri: selectedVideoUri,
                filename: 'background_video.mp4',
              };
              const recordedVideo: MediaItem = {
                id: video.path,
                uri: video.path,
                filename: 'recorded_video.mp4',
              };

              navigation.replace('VideoEdit', {
                videos: [backgroundVideo, recordedVideo],
              });
            }
          } catch (saveError) {
            console.error('영상 저장 실패:', saveError);
            Alert.alert('오류', '영상을 갤러리에 저장하는 데 실패했습니다.');
          }
        },
        onRecordingError: error => {
          console.error('녹화 중 에러 발생:', error);
          setIsRecording(false);
          Alert.alert('오류', '녹화 중 문제가 발생했습니다.');
          if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
            AudioSessionModule.deactivateAudioSession();
          }
        },
      });
    } catch (error) {
      console.error('오디오 세션 활성화 또는 녹화 시작 에러:', error);
      Alert.alert('오류', '녹화를 시작하는 중 문제가 발생했습니다.');
      setIsRecording(false);
    } finally {
      setIsLoading(false);
    }
  };


  // --- 권한 확인 UI ---
  if (isCheckingPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.infoText}>권한을 확인 중입니다...</Text>
      </SafeAreaView>
    );
  }
  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.infoText}>합주 녹화를 위해 카메라와 마이크 권한이 필요합니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const videoProps = Platform.select({
    ios: { mixWithOthers: 'mix' as const, disableAudioSessionManagement: true },
    android: {},
  });

  // --- 최종 렌더링 ---
  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.infoText}>녹화를 준비 중입니다...</Text>
        </View>
      )}

      <View style={styles.topContainer}>
        {selectedVideoUri ? (
          <Video
            ref={videoPlayer}
            source={{ uri: selectedVideoUri }}
            style={styles.videoPlayer}
            paused={isVideoPaused}
            resizeMode="contain"
            repeat={true}
            muted={false}
            {...videoProps}
          />
        ) : (
          <VideoPlaceholder 
            isEncoding={isEncoding}
            onSelectVideo={handleSelectVideo}
          />
        )}
      </View>

      <CameraView cameraRef={camera} device={device} />

      {selectedVideoUri && (
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordButtonPress}
          disabled={isLoading || isEncoding}
        />
      )}
    </SafeAreaView>
  );
};

// --- 메인 스크린에 필요한 최소한의 스타일 ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  videoPlayer: { ...StyleSheet.absoluteFillObject },
  infoText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default NewVideoTestScreen;