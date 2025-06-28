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
import { VideoRef } from 'react-native-video';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { StackNavigationProp } from '@react-navigation/stack';

const { AudioSessionModule } = NativeModules;

type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: undefined;
  MediaLibrary: undefined;
};

type CameraScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

const CameraScreen: React.FC<Props> = ({ navigation }) => {
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
      const resultOne = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      const resultTwo = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
      if (resultOne === RESULTS.GRANTED && resultTwo === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          '권한 필요',
          '영상을 저장하려면 사진첩 접근 권한이 필요합니다.',
        );
        return false;
      }
    } else {
      if (Platform.Version >= 33) {
        return true;
      }
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '저장 공간 권한 필요',
            message: '녹화된 영상을 갤러리에 저장하기 위해 권한이 필요합니다.',
            buttonPositive: '확인',
          },
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
      await checkAndRequestStoragePermission();
      setIsCheckingPermissions(false);
    };
    checkPermissions();

    return () => {
      if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, [requestCameraPermission, requestMicrophonePermission]);

  const handleRecordButtonPress = async () => {
    if (!camera.current) return;

    if (isRecording) {
      try {
        await camera.current.stopRecording();
        if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
          AudioSessionModule.deactivateAudioSession();
        }
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
      }
      setIsRecording(false);
      setIsVideoPaused(true);
      videoPlayer.current?.seek(0);
      return;
    }

    const hasStoragePermission = await checkAndRequestStoragePermission();
    if (!hasStoragePermission) {
      Alert.alert(
        '권한 거부됨',
        '갤러리 접근 권한 없이는 영상을 저장할 수 없습니다.',
      );
      return;
    }

    try {
      setIsLoading(true);
      await AudioSessionModule.activateAudioSession();
      console.log('JS: 네이티브 오디오 세션 활성화 성공.');

      setIsVideoPaused(false);

      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: async video => {
          console.log('녹화 완료:', video);
          if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
            AudioSessionModule.deactivateAudioSession();
          }

          try {
            await CameraRoll.saveAsset(video.path, { type: 'video' });
            Alert.alert('녹화 완료', '영상이 갤러리에 저장되었습니다!');
          } catch (saveError) {
            console.error('영상 저장 실패:', saveError);
            Alert.alert('오류', '영상을 갤러리에 저장하는 데 실패했습니다.');
          }
        },
        onRecordingError: error => {
          console.error('녹화 중 에러 발생:', error);
          Alert.alert('오류', '녹화 중 문제가 발생했습니다.');
          if (AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
            AudioSessionModule.deactivateAudioSession();
          }
        },
      });
    } catch (error) {
      console.error('오디오 세션 활성화 또는 녹화 시작 에러:', error);
      Alert.alert(
        '오류',
        '녹화를 시작하거나 오디오를 준비하는 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isPermissionsReady = hasCameraPermission && hasMicrophonePermission;

  if (isCheckingPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.infoText}>권한을 확인 중입니다...</Text>
      </SafeAreaView>
    );
  }

  if (!isPermissionsReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.infoText}>
            합주 녹화를 위해 카메라와 마이크 권한이 필요합니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.infoText}>카메라를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={handleRecordButtonPress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.recordButtonText}>
                {isRecording ? '⏹️' : '🔴'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordingButton: {
    backgroundColor: '#95a5a6',
  },
  recordButtonText: {
    fontSize: 24,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default CameraScreen;
