import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, Platform, NativeModules, PermissionsAndroid } from 'react-native';
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

import { RootStackParamList } from '../types'; // RootStackParamList 임포트
import InfoDisplay from '../components/Common/InfoDisplay'; // 리팩터링된 InfoDisplay
import RecordButton from '../components/RecordButton'; // 리팩터링된 RecordButton
import CameraView from '../components/CameraView'; // 리팩터링된 CameraView (styled-components 기반)

const { AudioSessionModule } = NativeModules;

type CameraScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #000;
`;

const CameraWrapperContainer = styled.View`
  flex: 1;
  position: relative;
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

/**
 * CameraScreen 컴포넌트는 사용자의 카메라와 마이크를 사용하여 비디오를 녹화하는 기능을 제공합니다.
 * 권한 확인, 녹화 시작/중지, 갤러리 저장 등의 로직을 포함합니다.
 * 모든 스타일은 styled-components로 정의되었으며, 공통 컴포넌트들을 활용합니다.
 */
const CameraScreen: React.FC<Props> = ({ navigation }) => {
  // 카메라 및 마이크 권한 상태와 요청 훅
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  // 사용 가능한 카메라 장치 (전면 카메라)
  const device = useCameraDevice('front');
  // VisionCamera의 Camera 컴포넌트에 연결할 ref
  const camera = useRef<Camera>(null);
  // react-native-video의 Video 컴포넌트에 연결할 ref (현재 이 화면에서는 직접 사용되지 않지만, 필요에 따라)
  const videoPlayer = useRef<VideoRef>(null);

  const [isRecording, setIsRecording] = useState(false); // 녹화 중인지 여부
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true); // 권한 확인 중인지 여부
  const [isLoading, setIsLoading] = useState(false); // 녹화 시작/중지 과정 중 로딩 상태

  // 저장 공간 접근 권한 확인 및 요청
  const checkAndRequestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const resultPhotoLibrary = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      // iOS 14+에서는 '사진첩에만 추가' 권한도 필요할 수 있음
      const resultPhotoLibraryAddOnly = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
      if (resultPhotoLibrary === RESULTS.GRANTED && resultPhotoLibraryAddOnly === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          '권한 필요',
          '영상을 저장하려면 사진첩 접근 권한이 필요합니다. 설정에서 허용해주세요.',
        );
        return false;
      }
    } else { // Android
      if (Platform.Version >= 33) { // Android 13+ (API 33) 이상에서는 READ_MEDIA_VIDEO 권한이 자동 부여되므로 별도 요청 불필요
        return true;
      }
      try { // Android 12 (API 32) 이하에서는 WRITE_EXTERNAL_STORAGE 권한 필요
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
        console.warn('저장 권한 요청 실패:', err);
        return false;
      }
    }
  };

  // 컴포넌트 마운트 시 권한 확인 및 요청
  useEffect(() => {
    const checkPermissions = async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();
      await checkAndRequestStoragePermission(); // 초기 로드 시 저장 권한도 요청
      setIsCheckingPermissions(false);
    };
    checkPermissions();

    // 컴포넌트 언마운트 시 오디오 세션 비활성화
    return () => {
      if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
        AudioSessionModule.deactivateAudioSession();
      }
    };
  }, [requestCameraPermission, requestMicrophonePermission]);

  // 녹화 버튼 클릭 핸들러
  const handleRecordButtonPress = async () => {
    if (!camera.current) return; // 카메라 ref가 없으면 종료

    // 녹화 중이면 중지
    if (isRecording) {
      try {
        await camera.current.stopRecording();
        if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
          AudioSessionModule.deactivateAudioSession(); // iOS 오디오 세션 비활성화
        }
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
        Alert.alert('오류', '녹화 중지 중 문제가 발생했습니다.');
      }
      setIsRecording(false); // 녹화 상태 해제
      return;
    }

    // 녹화 시작 전 저장 권한 확인
    const hasStoragePermission = await checkAndRequestStoragePermission();
    if (!hasStoragePermission) {
      // 권한 요청 시 Alert는 이미 처리되었으므로 추가 Alert 불필요
      return;
    }

    try {
      setIsLoading(true); // 로딩 상태 시작
      // iOS 오디오 세션 활성화 (Android는 VisionCamera가 자체적으로 처리)
      if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.activateAudioSession) {
        await AudioSessionModule.activateAudioSession();
        console.log('JS: 네이티브 오디오 세션 활성화 성공.');
      }

      setIsRecording(true); // 녹화 상태 시작
      camera.current.startRecording({
        // 녹화 완료 시 콜백
        onRecordingFinished: async video => {
          console.log('녹화 완료:', video);
          setIsRecording(false); // 녹화 상태 해제
          setIsLoading(false); // 로딩 상태 해제
          if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
            AudioSessionModule.deactivateAudioSession(); // iOS 오디오 세션 비활성화
          }

          try {
            await CameraRoll.saveAsset(video.path, { type: 'video' }); // 갤러리에 영상 저장
            Alert.alert('녹화 완료', '영상이 갤러리에 저장되었습니다!');
          } catch (saveError) {
            console.error('영상 저장 실패:', saveError);
            Alert.alert('오류', '영상을 갤러리에 저장하는 데 실패했습니다.');
          }
        },
        // 녹화 중 에러 발생 시 콜백
        onRecordingError: error => {
          console.error('녹화 중 에러 발생:', error);
          setIsRecording(false); // 녹화 상태 해제
          setIsLoading(false); // 로딩 상태 해제
          Alert.alert('오류', '녹화 중 문제가 발생했습니다.');
          if (Platform.OS === 'ios' && AudioSessionModule && AudioSessionModule.deactivateAudioSession) {
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
      setIsRecording(false); // 에러 발생 시 녹화 상태 리셋
      setIsLoading(false); // 에러 발생 시 로딩 상태 리셋
    }
  };

  // --- UI 렌더링 ---
  // 권한 확인 중일 때 로딩 인디케이터 표시
  if (isCheckingPermissions) {
    return (
      <ScreenContainer>
        <InfoDisplay showIndicator={true} message="권한을 확인 중입니다..." />
      </ScreenContainer>
    );
  }

  // 카메라 및 마이크 권한이 없을 때 메시지 표시
  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <ScreenContainer>
        <InfoDisplay message="합주 녹화를 위해 카메라와 마이크 권한이 필요합니다." />
      </ScreenContainer>
    );
  }

  // 사용 가능한 카메라 장치가 없을 때 메시지 표시
  if (!device) {
    return (
      <ScreenContainer>
        <InfoDisplay message="카메라를 찾을 수 없습니다." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <CameraWrapperContainer>
        {/* CameraView 컴포넌트를 사용하여 카메라 미리보기 표시 */}
        <CameraView cameraRef={camera} device={device} />

        {/* 녹화 시작/중지 중 로딩 오버레이 */}
        {isLoading && (
          <LoadingOverlay>
            <InfoDisplay showIndicator={true} message="녹화를 준비 중입니다..." />
          </LoadingOverlay>
        )}

        {/* 녹화 버튼 */}
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordButtonPress}
          disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
        />
      </CameraWrapperContainer>
    </ScreenContainer>
  );
};

export default CameraScreen;
