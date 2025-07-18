import React from 'react';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { WEB_FRONTEND_URL } from '@env';

import { RootStackParamList } from '../types'; // RootStackParamList 임포트
import CommonButton from '../components/Common/CommonButton'; // CommonButton 임포트 (수정됨)
import SectionHeader from '../components/Common/SectionHeader'; // SectionHeader 임포트

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #f3f4f6;
`;

const ContentScrollView = styled.ScrollView`
  padding: 20px;
  padding-bottom: 50px; /* Ensures content is not hidden by bottom controls */
`;

const TitleText = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #000;
  text-align: center;
  margin-bottom: 10px;
`;

const SubtitleText = styled.Text`
  font-size: 16px;
  color: #000;
  text-align: center;
  margin-bottom: 30px;
`;

const SectionContainer = styled.View`
  margin-bottom: 30px;
`;

// CommonButton을 확장하여 MainFeatureButton 정의
const MainFeatureButton = styled(CommonButton)`
  background-color: #f3f4f6; /* Darker background */
`;

// CommonButton을 확장하여 DevFeatureButton 정의
const DevFeatureButton = styled(CommonButton)`
  background-color: #8e44ad; /* A distinct color for dev features */
`;

// 버튼 텍스트 스타일 (CommonButton의 children으로 사용될 styled.Text)
const ButtonTextStyled = styled.Text`
  color: #333;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const InfoSectionContainer = styled.View`
  background-color: #fff;
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
  color: #000;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 8px;
  text-align: center;
`;

interface CustomJwtPayload {
  id: number;
}

/**
 * HomeScreen 컴포넌트는 앱의 시작 화면으로, 주요 기능 및 정보 섹션을 표시합니다.
 * 모든 스타일은 styled-components로 정의되었으며, CommonButton과 SectionHeader를 활용합니다.
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ScreenContainer>
      <ContentScrollView contentInsetAdjustmentBehavior="automatic">
        <TitleText>Recho</TitleText>
        <SubtitleText>통합된 비디오 편집 솔루션</SubtitleText>

        <SectionContainer>
          <SectionHeader title="메인 기능" />

          <MainFeatureButton
            onPress={() => navigation.navigate('MediaLibrary')}
          >
            <ButtonTextStyled>파일에서 비디오 선택</ButtonTextStyled>{' '}
            {/* children으로 텍스트 전달 */}
          </MainFeatureButton>

          <MainFeatureButton
            onPress={() => navigation.navigate('NewVideoTest')}
          >
            <ButtonTextStyled>합주 녹화 (카메라 + 비디오)</ButtonTextStyled>{' '}
            {/* children으로 텍스트 전달 */}
          </MainFeatureButton>
        </SectionContainer>

        <SectionContainer>
          <SectionHeader title="개발 및 테스트" />
          <DevFeatureButton onPress={() => navigation.navigate('FFmpegTest')}>
            <ButtonTextStyled>FFmpeg 테스트</ButtonTextStyled>{' '}
            {/* children으로 텍스트 전달 */}
          </DevFeatureButton>
          <DevFeatureButton
            onPress={async () => {
              const token = await AsyncStorage.getItem('accessToken');
              if (token) {
                const decodedToken = jwtDecode<CustomJwtPayload>(token);
                const id = decodedToken.id;
                // 뒤로가기 제한
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Web',
                      params: {
                        url: `${WEB_FRONTEND_URL}/users/${id}?token=${token}`,
                      },
                    },
                  ],
                });
              } else {
                // 토큰이 없으면 로그인 페이지로 이동
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Web',
                      params: {
                        url: `${WEB_FRONTEND_URL}/login`,
                      },
                    },
                  ],
                });
              }
            }}
          >
            <ButtonTextStyled>웹뷰 테스트</ButtonTextStyled>
          </DevFeatureButton>
        </SectionContainer>

        <InfoSectionContainer>
          <InfoTitle>앱 정보</InfoTitle>
          <InfoText>
            이 앱은 기존의 iOSTestApp과 new_video_test 프로젝트를 통합한
            것입니다.
          </InfoText>
          <InfoText>각 버튼을 눌러서 원하는 기능을 테스트해보세요.</InfoText>
        </InfoSectionContainer>
      </ContentScrollView>
    </ScreenContainer>
  );
};

export default HomeScreen;
