import React from 'react';
import styled from 'styled-components/native';
import { Platform } from 'react-native';

interface Props {
  isRecording: boolean; // 녹화 중인지 여부
  onPress: () => void; // 버튼 클릭 시 호출될 함수
  disabled: boolean; // 버튼 비활성화 여부
}

// Styled Components 정의

// 전체 컨트롤 컨테이너 (화면 하단에 절대 위치)
const ControlsContainer = styled.View`
  position: absolute;
  bottom: ${Platform.OS === 'ios' ? 40 : 20}px; /* 플랫폼에 따른 하단 마진 */
  left: 0;
  right: 0;
  align-items: center; /* 가로 중앙 정렬 */
`;

// 녹화 버튼의 기본 스타일
const RecordButtonContainer = styled.TouchableOpacity`
  width: 70px;
  height: 70px;
  border-radius: 35px; /* 원형 버튼 */
  background-color: rgba(255,255,255,0.2); /* 반투명 배경 */
  justify-content: center;
  align-items: center;
  border-width: 3px;
  border-color: white; /* 흰색 테두리 */
`;

// 녹화 시작 아이콘 (원형)
const RecordIconStart = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px; /* 원형 */
  background-color: #E53935; /* 빨간색 */
`;

// 녹화 중지 아이콘 (사각형)
const RecordIconStop = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 4px; /* 약간 둥근 사각형 */
  background-color: #E53935; /* 빨간색 */
`;

/**
 * RecordButton 컴포넌트는 비디오 녹화를 시작하고 중지하는 데 사용되는 버튼입니다.
 * 녹화 상태에 따라 아이콘이 원형 또는 사각형으로 변경됩니다.
 * 모든 스타일은 styled-components로 정의되었습니다.
 */
const RecordButton: React.FC<Props> = ({ isRecording, onPress, disabled }) => {
  return (
    <ControlsContainer>
      <RecordButtonContainer
        onPress={onPress}
        disabled={disabled} // 비활성화 상태 적용
        activeOpacity={0.7} // 클릭 시 투명도 조절
      >
        {isRecording ? (
          // 녹화 중이면 중지 아이콘 (사각형)
          <RecordIconStop />
        ) : (
          // 녹화 중이 아니면 시작 아이콘 (원형)
          <RecordIconStart />
        )}
      </RecordButtonContainer>
    </ControlsContainer>
  );
};

export default RecordButton;
