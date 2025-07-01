import React from 'react';
import styled from 'styled-components/native';
import { View } from 'react-native'; // View, Text for base types
import Slider from '@react-native-community/slider'; // Slider component is not easily styled with styled-components direct children
import { EQBand, formatFrequency } from '../../types'; // EQBand 및 formatFrequency 임포트

interface StyledSliderProps {
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

// Styled View for general wrappers
const ControlWrapper = styled.View`
  margin-bottom: 5px;
`;

// Styled Text for labels
const LabelText = styled.Text`
  font-size: 12px;
  color: #ecf0f1;
  font-weight: 500;
`;

// Styled View for horizontal slider container
const SliderContainer = styled.View`
  height: 25px;
  justify-content: center;
  align-items: center;
`;

// Styled Slider component (wrapping Slider from @react-native-community/slider)
// Note: Direct styling of Slider with styled-components can be tricky for track/thumb.
// We pass the tint colors as props to the native Slider component.
const StyledNativeSlider = styled(Slider)<StyledSliderProps>`
  width: 90%;
  height: 100%;
`;

const EqContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  height: 110px;
  margin-top: 5px;
`;

const EqBandVertical = styled.View`
  flex: 1;
  height: 100%;
  align-items: center;
  justify-content: space-between;
`;

const EqLabelText = styled.Text`
  font-size: 10px;
  color: #bdc3c7;
`;

export const SliderVerticalWrapper = styled.View.attrs({
  style: {
    transform: [{ rotate: '-90deg' }],
  },
})`
  width: 80px;
  height: 25px;
`;

const StyledVerticalNativeSlider = styled(Slider)<StyledSliderProps>`
  width: 80px;
  height: 25px;
`;

const EqGainLabelText = styled.Text`
  font-size: 10px;
  color: #ecf0f1;
`;

interface Props {
  volume: number;
  equalizer: EQBand[];
  onVolumeChange: (value: number) => void;
  onEQChange: (bandId: string, gain: number) => void;
}

/**
 * AudioControls 컴포넌트는 볼륨 및 이퀄라이저 설정을 위한 UI를 제공합니다.
 * styled-components를 사용하여 각 UI 요소의 스타일을 정의하고 관리합니다.
 * 볼륨은 수평 슬라이더로, 이퀄라이저 밴드는 수직 슬라이더로 표현됩니다.
 */
const AudioControls: React.FC<Props> = ({ volume, equalizer, onVolumeChange, onEQChange }) => {
  return (
    <View>
      <ControlWrapper>
        <LabelText>볼륨: {Math.round(volume * 100)}%</LabelText>
        <SliderContainer>
          <StyledNativeSlider
            minimumValue={0}
            maximumValue={2}
            value={volume}
            onValueChange={onVolumeChange}
            minimumTrackTintColor="#2ecc71"
            maximumTrackTintColor="#bdc3c7"
            thumbTintColor="#2ecc71"
          />
        </SliderContainer>
      </ControlWrapper>

      <ControlWrapper>
        <LabelText>이퀄라이저</LabelText>
        <EqContainer>
          {equalizer.map(band => (
            <EqBandVertical key={band.id}>
              <EqLabelText>{formatFrequency(band.frequency)}</EqLabelText>
              <SliderVerticalWrapper>
                <StyledVerticalNativeSlider
                  minimumValue={-20}
                  maximumValue={20}
                  value={band.gain}
                  onValueChange={value => onEQChange(band.id, value)}
                  minimumTrackTintColor="#f39c12"
                  maximumTrackTintColor="#bdc3c7"
                  thumbTintColor="#f39c12"
                />
              </SliderVerticalWrapper>
              <EqGainLabelText>{band.gain.toFixed(0)}dB</EqGainLabelText>
            </EqBandVertical>
          ))}
        </EqContainer>
      </ControlWrapper>
    </View>
  );
};

export default AudioControls;
