import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  NativeModules,
  PermissionsAndroid,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import DocumentPicker from 'react-native-document-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MediaItem } from '../types';

const { AudioSessionModule } = NativeModules;

type NewVideoTestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewVideoTest'>;

interface Props {
  navigation: NewVideoTestScreenNavigationProp;
}

const NewVideoTestScreen: React.FC<Props> = ({ navigation }) => {
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
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const checkAndRequestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert('권한 필요', '영상을 저장하려면 사진첩 접근 권한이 필요합니다.');
        return false;
      }
    } else {
      if (Platform.Version >= 33) {
        const videoPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
        const audioPermission = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
        return videoPermission === RESULTS.GRANTED && audioPermission === RESULTS.GRANTED;
      }
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
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
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: false,
      });
      setSelectedVideoUri(result[0].uri);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('사용자가 비디오 선택을 취소했습니다.');
      } else {
        console.error('Document Picker 에러:', err);
      }
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
      Alert.alert('권한 거부됨', '갤러리 접근 권한 없이는 영상을 저장할 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      if (AudioSessionModule && AudioSessionModule.activateAudioSession) {
        await AudioSessionModule.activateAudioSession();
      }

      videoPlayer.current?.seek(0);
      setIsVideoPaused(false);
      setIsRecording(true);

      camera.current.startRecording({
        onRecordingFinished: async video => {
          setIsRecording(false);
          if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
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
          if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
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
            mixWithOthers="mix"
            muted={false}
            disableAudioSessionManagement={true}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>합주할 동영상을 불러와주세요.</Text>
            <TouchableOpacity style={styles.selectButton} onPress={handleSelectVideo}>
              <Text style={styles.buttonText}>내 휴대폰에서 동영상 찾기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.bottomContainer}>
        {device ? (
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            video={true}
            audio={true}
          />
        ) : (
          <Text style={styles.infoText}>사용 가능한 카메라가 없습니다.</Text>
        )}
      </View>
      {selectedVideoUri && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleRecordButtonPress}
            disabled={isLoading}
          >
            <View style={isRecording ? styles.recordIconStop : styles.recordIconStart} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: { flex: 1, backgroundColor: '#111' },
  videoPlayer: { ...StyleSheet.absoluteFillObject },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { color: 'white', fontSize: 16, marginBottom: 20 },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  recordIconStart: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E53935',
  },
  recordIconStop: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default NewVideoTestScreen;