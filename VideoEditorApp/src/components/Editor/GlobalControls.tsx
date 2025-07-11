import React from 'react';
import styled from 'styled-components/native';
import { Play, Pause, Rewind, FastForward } from 'lucide-react-native';
import { ViewStyle } from 'react-native';

const ControlsContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
`;

const IconButton = styled.TouchableOpacity`
  padding: 10px;
  margin: 0 10px;
`;

interface GlobalControlsProps {
  isGloballyPlaying: boolean;
  onToggleGlobalPlay: () => void;
  onGlobalSeekToStart: () => void;
  onGlobalSeekToEnd: () => void;
  style?: ViewStyle;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({
  isGloballyPlaying,
  onToggleGlobalPlay,
  onGlobalSeekToStart,
  onGlobalSeekToEnd,
  style,
}) => {
  return (
    <ControlsContainer style={style}>
      <IconButton onPress={onGlobalSeekToStart}>
        <Rewind color="white" size={18} />
      </IconButton>
      <IconButton onPress={onToggleGlobalPlay}>
        {isGloballyPlaying ? (
          <Pause color="white" size={24} />
        ) : (
          <Play color="white" size={24} />
        )}
      </IconButton>
      <IconButton onPress={onGlobalSeekToEnd}>
        <FastForward color="white" size={18} />
      </IconButton>
    </ControlsContainer>
  );
};

export default GlobalControls;
