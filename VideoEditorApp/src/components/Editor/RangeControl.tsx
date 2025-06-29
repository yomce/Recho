import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Button, KeyboardAvoidingView, Platform } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { EditingTimeType } from '../../types';

const screenWidth = Dimensions.get('window').width;
const sliderLength = screenWidth - 100;

interface Props {
  startTime: number;
  endTime: number;
  duration: number;
  currentTime: number;
  onValuesChange: (values: number[]) => void;
  onSeek: (time: number) => void;
}

const RangeControl: React.FC<Props> = ({ startTime, endTime, duration, currentTime, onValuesChange, onSeek }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTimeType, setEditingTimeType] = useState<EditingTimeType>(null);
  const [tempTimeValue, setTempTimeValue] = useState('');

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const indicatorPosition = (sliderLength * progressPercent) / 100;

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (duration > 0) {
      const locationX = event.nativeEvent.x;
      const clampedX = Math.max(0, Math.min(locationX, sliderLength));
      const seekTime = (clampedX / sliderLength) * duration;
      onSeek(seekTime);
    }
  };

  const openTimeModal = (type: EditingTimeType) => {
    setEditingTimeType(type);
    setTempTimeValue(type === 'start' ? startTime.toString() : endTime.toString());
    setModalVisible(true);
  };

  const handleConfirmTime = () => {
    const newTime = parseFloat(tempTimeValue);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
      if (editingTimeType === 'start') {
        onValuesChange([newTime, Math.max(newTime, endTime)]);
      } else if (editingTimeType === 'end') {
        onValuesChange([Math.min(newTime, startTime), newTime]);
      }
    } else {
      alert('유효한 시간을 입력해주세요.');
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.controlWrapper}>
      <Text style={styles.label}>편집 구간 설정</Text>
      <View style={styles.timeLabelContainer}>
        <TouchableOpacity onPress={() => openTimeModal('start')}>
          <Text style={styles.timeTextEditable}>시작: {startTime.toFixed(1)}s</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openTimeModal('end')}>
          <Text style={styles.timeTextEditable}>종료: {endTime.toFixed(1)}s</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderContainer}>
        <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onGestureEvent}>
          <View style={styles.sliderEventCatcher}>
            <MultiSlider
              values={[startTime, endTime]}
              onValuesChange={onValuesChange}
              min={0}
              max={duration > 0 ? duration : 1}
              step={0.1}
              allowOverlap={false}
              snapped
              sliderLength={sliderLength}
              containerStyle={styles.multiSliderContainer}
              trackStyle={styles.trackStyle}
              selectedStyle={styles.selectedTrackStyle}
              markerStyle={styles.markerStyle}
              enabledTwo
              isMarkersSeparated
            />
            {currentTime >= startTime && currentTime <= endTime && (
              <View style={[styles.progressIndicator, { left: indicatorPosition }]} pointerEvents="none" />
            )}
          </View>
        </PanGestureHandler>
      </View>

      <Modal
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTimeType === 'start' ? '시작' : '종료'} 시간 입력 (초)</Text>
            <TextInput
              style={styles.textInput}
              value={tempTimeValue}
              onChangeText={setTempTimeValue}
              keyboardType="numeric"
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="취소" onPress={() => setModalVisible(false)} color="#e74c3c" />
              <Button title="확인" onPress={handleConfirmTime} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    controlWrapper: {
        marginBottom: 10,
    },
    label: {
        fontSize: 13,
        color: '#ecf0f1',
        fontWeight: '500',
        marginBottom: 4,
    },
    timeLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeTextEditable: {
        fontSize: 11,
        color: '#3498db',
        textDecorationLine: 'underline',
        paddingVertical: 5,
    },
    sliderContainer: {
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderEventCatcher: {
        width: sliderLength,
        height: '100%',
        justifyContent: 'center',
        position: 'relative',
    },
    multiSliderContainer: {
        height: '100%',
    },
    progressIndicator: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#e74c3c',
        borderWidth: 2,
        borderColor: '#ffffff',
        top: '50%',
        marginTop: -7,
        marginLeft: -7,
        zIndex: 3,
    },
    trackStyle: {
        height: 4,
        backgroundColor: '#7f8c8d',
        borderRadius: 2,
    },
    selectedTrackStyle: {
        backgroundColor: '#3498db',
    },
    markerStyle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        backgroundColor: '#3498db',
        borderWidth: 2,
        borderColor: '#ecf0f1',
        zIndex: 2,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#34495e',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        color: '#ecf0f1',
        marginBottom: 15,
    },
    textInput: {
        backgroundColor: '#2c3e50',
        color: '#ecf0f1',
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});

export default RangeControl;