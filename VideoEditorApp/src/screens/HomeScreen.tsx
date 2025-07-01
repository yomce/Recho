import React, { useEffect } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { RootStackParamList } from '../types'; // RootStackParamList 임포트
import CommonButton from '../components/Common/CommonButton'; // CommonButton 임포트 (수정됨)
import SectionHeader from '../components/Common/SectionHeader'; // SectionHeader 임포트

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #34495e;
`;

const ContentScrollView = styled.ScrollView`
  padding: 20px;
  padding-bottom: 50px; /* Ensures content is not hidden by bottom controls */
`;

const TitleText = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #ecf0f1;
  text-align: center;
  margin-bottom: 10px;
`;

const SubtitleText = styled.Text`
  font-size: 16px;
  color: #bdc3c7;
  text-align: center;
  margin-bottom: 30px;
`;

const SectionContainer = styled.View`
  margin-bottom: 30px;
`;

// CommonButton을 확장하여 MainFeatureButton 정의
const MainFeatureButton = styled(CommonButton)`
  background-color: #2c3e50; /* Darker background */
  border-width: 1px;
  border-color: #34495e;
`;

// CommonButton을 확장하여 DevFeatureButton 정의
const DevFeatureButton = styled(CommonButton)`
  background-color: #8e44ad; /* A distinct color for dev features */
`;

// 버튼 텍스트 스타일 (CommonButton의 children으로 사용될 styled.Text)
const ButtonTextStyled = styled.Text`
  color: #ecf0f1;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const InfoSectionContainer = styled.View`
  background-color: #2c3e50;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
  margin-horizontal: 20px; /* Consistent horizontal padding */
`;

const InfoTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 10px;
  text-align: center;
`;

const InfoText = styled.Text`
  color: #bdc3c7;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 8px;
  text-align: center;
`;


/**
 * HomeScreen 컴포넌트는 앱의 시작 화면으로, 주요 기능 및 정보 섹션을 표시합니다.
 * 카메라, 마이크, 저장 공간 권한을 확인하고 요청하는 로직을 포함합니다.
 * 모든 스타일은 styled-components로 정의되었으며, CommonButton과 SectionHeader를 활용합니다.
 */
const HomeScreen: React.FC = () => {
  // 카메라 및 마이크 권한 상태와 요청 훅
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  /**
   * 카메라, 마이크, 저장 공간 권한을 확인하고 요청합니다.
   * @returns 모든 권한이 부여되었는지 여부
   */
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    const results = await Promise.all([
      requestCameraPermission(),
      requestMicrophonePermission(),
      // Android 13+ (API 33) 이상에서는 READ_MEDIA_* 권한을 사용합니다.
      // Android 12 (API 32) 이하에서는 READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE를 사용합니다.
      // iOS에서는 PHOTO_LIBRARY 권한을 사용합니다.
      Platform.OS === 'android' && Platform.Version >= 33
        ? Promise.all([
            request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO),
            request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES),
            request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO),
          ])
        : Platform.OS === 'android'
        ? Promise.all([
            request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE),
            request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE),
          ])
        : request(PERMISSIONS.IOS.PHOTO_LIBRARY),
    ]);

    // Promise.all의 결과를 평탄화하고 모든 권한이 'granted'인지 확인
    const allGranted = results.flat().every(result => result === RESULTS.GRANTED || typeof result === 'boolean' && result);

    if (!allGranted) {
      Alert.alert(
        '권한 필요',
        '앱 사용을 위해 카메라, 마이크, 저장 공간 권한이 모두 필요합니다. 앱 설정에서 권한을 허용해주세요.',
      );
      return false;
    }
    return true;
  };

  // 컴포넌트 마운트 시 권한 확인 및 요청
  useEffect(() => {
    const initialize = async () => {
      await checkAndRequestPermissions();
    };
    initialize();
  }, []); // 빈 배열은 컴포넌트가 마운트될 때 한 번만 실행

  return (
    <ScreenContainer>
      <ContentScrollView contentInsetAdjustmentBehavior="automatic">
        <TitleText>🎬 비디오 편집 앱</TitleText>
        <SubtitleText>통합된 비디오 편집 솔루션</SubtitleText>

        <SectionContainer>
          <SectionHeader title="📱 메인 기능" />

          <MainFeatureButton onPress={() => navigation.navigate('MediaLibrary')}>
            <ButtonTextStyled>파일에서 비디오 선택</ButtonTextStyled> {/* children으로 텍스트 전달 */}
          </MainFeatureButton>

          <MainFeatureButton onPress={() => navigation.navigate('NewVideoTest')}>
            <ButtonTextStyled>🎤 합주 녹화 (카메라 + 비디오)</ButtonTextStyled> {/* children으로 텍스트 전달 */}
          </MainFeatureButton>
        </SectionContainer>

        <SectionContainer>
          <SectionHeader title="🛠️ 개발 및 테스트" />
          <DevFeatureButton onPress={() => navigation.navigate('FFmpegTest')}>
            <ButtonTextStyled>FFmpeg 테스트</ButtonTextStyled> {/* children으로 텍스트 전달 */}
          </DevFeatureButton>
        </SectionContainer>

        <InfoSectionContainer>
          <InfoTitle>ℹ️ 앱 정보</InfoTitle>
          <InfoText>
            이 앱은 기존의 iOSTestApp과 new_video_test 프로젝트를 통합한
            것입니다.
          </InfoText>
          <InfoText>
            각 버튼을 눌러서 원하는 기능을 테스트해보세요.
          </InfoText>
        </InfoSectionContainer>
      </ContentScrollView>
    </ScreenContainer>
  );
};

export default HomeScreen;
