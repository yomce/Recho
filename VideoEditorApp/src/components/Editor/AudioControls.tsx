import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { EQBand } from '../../types';

const formatFrequency = (freq: number): string => {
  if (freq >= 1000) return `${freq / 1000}kHz`;
  return `${freq}Hz`;
};

interface Props {
  volume: number;
  equalizer: EQBand[];
  onVolumeChange: (value: number) => void;
  onEQChange: (bandId: string, gain: number) => void;
}

const AudioControls: React.FC<Props> = ({ volume, equalizer, onVolumeChange, onEQChange }) => {
  return (
    <View>
      <View style={styles.controlWrapper}>
        <Text style={styles.label}>볼륨: {Math.round(volume * 100)}%</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            value={volume}
            onValueChange={onVolumeChange}
            minimumTrackTintColor="#2ecc71"
            maximumTrackTintColor="#bdc3c7"
            thumbTintColor="#2ecc71"
          />
        </View>
      </View>

      <View style={styles.controlWrapper}>
        <Text style={styles.label}>이퀄라이저</Text>
        <View style={styles.eqContainer}>
          {equalizer.map(band => (
            <View key={band.id} style={styles.eqBandVertical}>
              <Text style={styles.eqLabel}>{formatFrequency(band.frequency)}</Text>
              <View style={styles.sliderVerticalWrapper}>
                <Slider
                  style={styles.sliderVertical}
                  minimumValue={-20}
                  maximumValue={20}
                  value={band.gain}
                  onValueChange={value => onEQChange(band.id, value)}
                  minimumTrackTintColor="#f39c12"
                  maximumTrackTintColor="#bdc3c7"
                  thumbTintColor="#f39c12"
                />
              </View>
              <Text style={styles.eqGainLabel}>{band.gain.toFixed(0)}dB</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    controlWrapper: {
        marginBottom: 5,
    },
    label: {
        fontSize: 12,
        color: '#ecf0f1',
        fontWeight: '500',
    },
    sliderContainer: {
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slider: {
        width: '90%',
        height: '100%',
    },
    eqContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 110,
        marginTop: 5,
    },
    eqBandVertical: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eqLabel: {
        fontSize: 10,
        color: '#bdc3c7',
    },
    sliderVerticalWrapper: {
        width: 80,
        height: 25,
        transform: [{ rotate: '-90deg' }],
    },
    sliderVertical: {
        width: 80,
        height: 25,
    },
    eqGainLabel: {
        fontSize: 10,
        color: '#ecf0f1',
    },
});

export default AudioControls;