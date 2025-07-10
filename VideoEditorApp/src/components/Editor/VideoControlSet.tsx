import React from 'react';
import styled from 'styled-components/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RangeControl from './RangeControl';
import AudioControls from './AudioControls';
import { EQBand, TrimmerState } from '../../types';

// Styled Components
const ControlsContainer = styled.View`
  margin-horizontal: 15px;
  margin-bottom: 15px;
  background-color: #000000;
  border-width: 1px;
  border-color: #333333;
  border-radius: 12px;
  padding: 10px;
`;

const ControlsSection = styled.View`
  border-top-width: 1px;
  border-top-color: rgba(44, 62, 80, 0.8);
  margin-top: 10px;
  padding-top: 10px;
`;

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #ecf0f1;
  margin-bottom: 10px;
  padding-horizontal: 5px;
`;

// Props 정의
interface VideoControlSetProps {
  title: string;
  videoDuration: number;
  initialStartTime: number;
  initialEndTime: number;
  initialVolume: number;
  initialEqualizer: EQBand[];
  onUpdate: (newState: Partial<Omit<TrimmerState, 'id'>>) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

const VideoControlSet: React.FC<VideoControlSetProps> = ({
  videoDuration,
  initialStartTime,
  initialEndTime,
  initialVolume,
  initialEqualizer,
  onUpdate,
  currentTime,
  onSeek,
}) => {
  // 편집 구간 (RangeControl) 변경 핸들러
  const handleRangeChange = (values: number[]) => {
    onUpdate({ startTime: values[0], endTime: values[1] });
    // 현재 재생 시간이 새로운 편집 구간 밖이면 시작 시간으로 이동
    if (currentTime < values[0] || currentTime > values[1]) {
      onSeek(values[0]);
    }
  };

  // 볼륨 변경 핸들러
  const handleVolumeChange = (value: number) => {
    onUpdate({ volume: value });
  };

  // 이퀄라이저 밴드 게인 변경 핸들러
  const handleEQChange = (bandId: string, gain: number) => {
    const newEQ = initialEqualizer.map(b =>
      b.id === bandId ? { ...b, gain } : b,
    );
    onUpdate({ equalizer: newEQ });
  };

  return (
    <GestureHandlerRootView>
      <ControlsContainer>
        {/* <SectionTitle>{title}</SectionTitle> */}
        <ControlsSection>
          <RangeControl
            startTime={initialStartTime}
            endTime={initialEndTime}
            duration={videoDuration}
            currentTime={currentTime}
            onValuesChange={handleRangeChange}
            onSeek={onSeek}
          />
          <AudioControls
            volume={initialVolume}
            equalizer={initialEqualizer}
            onVolumeChange={handleVolumeChange}
            onEQChange={handleEQChange}
          />
        </ControlsSection>
      </ControlsContainer>
    </GestureHandlerRootView>
  );
};

export default VideoControlSet;
