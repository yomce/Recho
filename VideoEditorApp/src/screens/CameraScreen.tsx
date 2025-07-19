import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import {
  SafeAreaView,
  Alert,
  Platform,
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
 * 녹화 시작/중지, 갤러리 저장 등의 로직을 포함합니다.
 * 모든 스타일은 styled-components로 정의되었으며, 공통 컴포넌트들을 활용합니다.
 */
const CameraScreen: React.FC<Props> = ({ navigation }) => {
  // 카메라 및 마이크 권한 상태 확인 훅
  const { hasPermission: hasCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission } = useMicrophonePermission();

  // 사용 가능한 카메라 장치 (전면 카메라)
  const device = useCameraDevice('front');
  // VisionCamera의 Camera 컴포넌트에 연결할 ref
  const camera = useRef<Camera>(null);
  // react-native-video의 Video 컴포넌트에 연결할 ref (현재 이 화면에서는 직접 사용되지 않지만, 필요에 따라)
  const videoPlayer = useRef<VideoRef>(null);

  const [isRecording, setIsRecording] = useState(false); // 녹화 중인지 여부
  const [isLoading, setIsLoading] = useState(false); // 녹화 시작/중지 과정 중 로딩 상태

  // 컴포넌트 마운트 시 오디오 세션 비활성화 설정
  useEffect(() => {
    // 컴포넌트 언마운트 시 오디오 세션 비활성화
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

  // 녹화 버튼 클릭 핸들러
  const handleRecordButtonPress = async () => {
    if (!camera.current) return; // 카메라 ref가 없으면 종료

    // 권한 확인
    if (!hasCameraPermission || !hasMicrophonePermission) {
      Alert.alert(
        '권한 필요',
        '카메라와 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.',
      );
      return;
    }

    // 녹화 중이면 중지
    if (isRecording) {
      try {
        await camera.current.stopRecording();
        if (
          Platform.OS === 'ios' &&
          AudioSessionModule &&
          AudioSessionModule.deactivateAudioSession
        ) {
          AudioSessionModule.deactivateAudioSession(); // iOS 오디오 세션 비활성화
        }
      } catch (e) {
        console.error('녹화 중지 실패: ', e);
        Alert.alert('오류', '녹화 중지 중 문제가 발생했습니다.');
      }
      setIsRecording(false); // 녹화 상태 해제
      return;
    }

    try {
      setIsLoading(true); // 로딩 상태 시작
      // iOS 오디오 세션 활성화 (Android는 VisionCamera가 자체적으로 처리)
      if (
        Platform.OS === 'ios' &&
        AudioSessionModule &&
        AudioSessionModule.activateAudioSession
      ) {
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
          if (
            Platform.OS === 'ios' &&
            AudioSessionModule &&
            AudioSessionModule.deactivateAudioSession
          ) {
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
          if (
            Platform.OS === 'ios' &&
            AudioSessionModule &&
            AudioSessionModule.deactivateAudioSession
          ) {
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
      <CameraWrapperContainer>
        <CameraView device={device} cameraRef={camera} />
        <RecordButton
          isRecording={isRecording}
          isLoading={isLoading}
          onPress={handleRecordButtonPress}
        />
      </CameraWrapperContainer>
    </ScreenContainer>
  );
};

export default CameraScreen;
