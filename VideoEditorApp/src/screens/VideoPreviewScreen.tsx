import React from 'react';
import styled from 'styled-components/native';
import { Dimensions, SafeAreaView } from 'react-native';
import Video from 'react-native-video';
import { StackScreenProps } from '@react-navigation/stack';

import { RootStackParamList } from '../types'; // RootStackParamList 임포트
import CommonButton from '../components/Common/CommonButton'; // CommonButton 임포트 (수정됨)
import SectionHeader from '../components/Common/SectionHeader'; // SectionHeader 임포트

// 화면 컴포넌트의 props 타입을 정의합니다.
type VideoPreviewScreenProps = StackScreenProps<
  RootStackParamList,
  'VideoPreview'
>;

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #34495e; /* CommonStyles.screenContainer.backgroundColor와 동일 */
`;

const ContentContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: transparent; /* ScreenContainer에서 배경색을 이미 설정했으므로 투명하게 */
`;

const VideoPlayerStyled = styled(Video)`
  width: ${Dimensions.get('window').width * 0.9}px; /* 화면 너비의 90% */
  height: ${Dimensions.get('window').width * 0.9 * (9 / 16)}px; /* 16:9 비율 유지 */
  background-color: black;
  margin-bottom: 20px;
  border-radius: 8px; /* 둥근 모서리 */
`;

// CommonButton을 확장하여 NavButton 정의
const NavButton = styled(CommonButton)`
  background-color: #4a90e2; /* 내비게이션 버튼 색상 */
  margin-bottom: 10px;
  width: 80%; /* 버튼 너비 */
`;

// 버튼 텍스트 스타일 (CommonButton의 children으로 사용될 styled.Text)
const ButtonTextStyled = styled.Text`
  color: #ffffff; /* CommonButton의 기본 텍스트 색상과 일치 */
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

/**
 * VideoPreviewScreen 컴포넌트는 번들된 비디오를 미리보기하고,
 * 다른 테스트 화면으로 이동하는 내비게이션 버튼을 제공합니다.
 * 모든 스타일은 styled-components로 정의되었으며, 공통 컴포넌트를 활용합니다.
 */
const VideoPreviewScreen: React.FC<VideoPreviewScreenProps> = ({
  navigation,
}) => {
  // 번들된 비디오 파일의 경로를 사용합니다. 실제 프로젝트에서는 assets/videos 폴더에 존재해야 합니다.
  // 이 예시에서는 로컬 번들링 경로를 가정합니다.
  // 실제 앱에서는 DocumentPicker 등을 통해 선택된 파일의 URI를 사용하는 것이 일반적입니다.
  const videoSource = require('../../assets/videos/catvideo.mp4'); // 프로젝트 구조에 따라 경로 조정

  return (
    <ScreenContainer>
      <ContentContainer>
        <SectionHeader title="👁️ 비디오 미리보기" />

        <VideoPlayerStyled
          source={videoSource}
          controls={true} // 비디오 컨트롤러 표시
          resizeMode="contain" // 비디오 크기 조절 모드
          repeat={true} // 반복 재생
          onLoad={() => console.log('Video loaded successfully')}
          onError={error => console.log('Video loading error:', error)}
        />

        <NavButton onPress={() => navigation.navigate('FFmpegTest')}>
          <ButtonTextStyled>FFmpeg 테스트 화면으로 이동</ButtonTextStyled> {/* children으로 텍스트 전달 */}
        </NavButton>
        <NavButton
          onPress={() => {
            // RootStackParamList에 'SideBySide'가 정의되어 있는지 확인 후 내비게이션
            // 이 로직은 RootStackParamList에 SideBySide가 선택적일 때 유용합니다.
            if (navigation.canGoBack() && (navigation.getState().routeNames as string[]).includes('SideBySide')) {
                navigation.navigate('SideBySide');
            } else {
                console.warn("SideBySideScreen is not defined in RootStackParamList or cannot navigate.");
                // 사용자에게 알림을 주거나 홈으로 돌아가는 등의 폴백 처리 가능
                // Alert.alert("알림", "Side-by-Side 테스트 화면을 찾을 수 없습니다.");
            }
          }}
        >
          <ButtonTextStyled>Side-by-Side 테스트 화면으로 이동</ButtonTextStyled> {/* children으로 텍스트 전달 */}
        </NavButton>
      </ContentContainer>
    </ScreenContainer>
  );
};

export default VideoPreviewScreen;
