import React from 'react';
import styled from 'styled-components/native';
import InfoDisplay from './Common/InfoDisplay'; // 리팩터링된 InfoDisplay 임포트

interface Props {
  isEncoding: boolean; // 인코딩 중인지 여부
  onSelectVideo: () => void; // 비디오 선택 버튼 클릭 시 호출될 함수
}

// Styled Components 정의

// 전체 컨테이너
const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-horizontal: 20px;
`;

// 플레이스홀더 텍스트
const PlaceholderText = styled.Text`
  color: white;
  font-size: 16px;
  margin-bottom: 20px;
`;

// 선택 버튼
const SelectButton = styled.TouchableOpacity`
  padding-horizontal: 20px;
  padding-vertical: 12px;
  border-radius: 25px;
  background-color: #007AFF; /* 버튼 배경색 */
`;

// 버튼 텍스트
const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

/**
 * VideoPlaceholder 컴포넌트는 비디오가 로드되지 않았거나 인코딩 중일 때 표시되는
 * 플레이스홀더 UI를 제공합니다. 사용자에게 비디오 선택을 안내하거나 인코딩 진행 상황을 보여줍니다.
 * `InfoDisplay` 컴포넌트를 활용하여 로딩 및 정보 메시지를 일관성 있게 처리합니다.
 * 모든 스타일은 styled-components로 정의되었습니다.
 */
const VideoPlaceholder: React.FC<Props> = ({ isEncoding, onSelectVideo }) => {
  if (isEncoding) {
    return (
      // 인코딩 중일 때 InfoDisplay 컴포넌트 사용
      <InfoDisplay
        showIndicator={true} // ActivityIndicator 표시
        message="인코딩 중입니다..."
        subMessage="고해상도 영상은 다소 시간이 걸릴 수 있습니다."
      />
    );
  }

  return (
    // 비디오 선택을 위한 플레이스홀더 UI
    <Container>
      <PlaceholderText>합주할 동영상을 불러와주세요.</PlaceholderText>
      <SelectButton onPress={onSelectVideo} activeOpacity={0.7}>
        <ButtonText>내 휴대폰에서 동영상 찾기</ButtonText>
      </SelectButton>
    </Container>
  );
};

export default VideoPlaceholder;
