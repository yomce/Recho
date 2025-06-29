import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface Props {
  isRecording: boolean;
  onPress: () => void;
  disabled: boolean;
}

const RecordButton: React.FC<Props> = ({ isRecording, onPress, disabled }) => {
  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={isRecording ? styles.recordIconStop : styles.recordIconStart} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white',
  },
  recordIconStart: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E53935' },
  recordIconStop: { width: 28, height: 28, borderRadius: 4, backgroundColor: '#E53935' },
});

export default RecordButton;