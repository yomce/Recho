import React from 'react';
import styled from 'styled-components/native';
import {
  Play,
  Pause,
  AlignStartVertical,
  AlignEndVertical,
} from 'lucide-react-native';
import { StyleProp, ViewStyle } from 'react-native';
import CommonButton from '../Common/CommonButton';

// =================================================================================
// 1. 스타일 컴포넌트 (UI)
// =================================================================================

const GlobalActionsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  background-color: #000000;
  max-width: 200px;
  align-self: center;
  align-items: center;
  justify-content: center;
`;

const GlobalActionButton = styled(CommonButton)`
  height: 38px; /* 고정 높이 지정 */
  padding-vertical: 0; /* 상하 패딩 제거 */
  padding-horizontal: 12px;
  border-radius: 8px;
  margin-bottom: 0;
  flex: 1;
  margin-horizontal: 5px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

// =================================================================================
// 2. 타입 정의 (Props)
// =================================================================================

interface GlobalControlsProps {
  isGloballyPlaying: boolean;
  onToggleGlobalPlay: () => void;
  onGlobalSeekToStart: () => void;
  style?: StyleProp<ViewStyle>;
  // onGlobalSeekToEnd: () => void; // 나중에 수정될 기능
}

// =================================================================================
// 3. 메인 컴포넌트
// =================================================================================

const GlobalControls: React.FC<GlobalControlsProps> = ({
  isGloballyPlaying,
  onToggleGlobalPlay,
  onGlobalSeekToStart,
  style,
}) => {
  return (
    <GlobalActionsContainer style={style}>
      <GlobalActionButton onPress={onGlobalSeekToStart}>
        <AlignStartVertical color="#ffffff" size={18} />
      </GlobalActionButton>
      {isGloballyPlaying ? (
        <GlobalActionButton onPress={onToggleGlobalPlay}>
          <Pause color="#ffffff" size={18} />
        </GlobalActionButton>
      ) : (
        <GlobalActionButton onPress={onToggleGlobalPlay}>
          <Play color="#ffffff" size={18} />
        </GlobalActionButton>
      )}
      {/* 나중에 수정 */}
      <GlobalActionButton
        onPress={onGlobalSeekToStart} // 임시로 시작점으로 가게 함
      >
        <AlignEndVertical color="#ffffff" size={18} />
      </GlobalActionButton>
    </GlobalActionsContainer>
  );
};

export default GlobalControls;
