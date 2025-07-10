import React, { useState } from 'react';
import styled from 'styled-components/native';
import {
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { EditingTimeType, formatTime } from '../../types'; // EditingTimeType 및 formatTime 임포트

const screenWidth = Dimensions.get('window').width;
const sliderLength = screenWidth - 100; // 슬라이더 길이 (좌우 여백 고려)

// Styled Components 정의
const ControlWrapper = styled.View`
  margin-bottom: 10px;
`;

const LabelText = styled.Text`
  font-size: 13px;
  color: #ecf0f1;
  font-weight: 500;
  margin-bottom: 4px;
`;

const TimeLabelContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TimeTextEditable = styled.Text`
  font-size: 11px;
  color: #3498db;
  text-decoration-line: underline;
  padding-vertical: 5px;
`;

const SliderContainer = styled.View`
  height: 30px;
  justify-content: center;
  align-items: center;
`;

const SliderEventCatcher = styled.View`
  width: ${sliderLength}px; /* 동적으로 계산된 슬라이더 길이 적용 */
  height: 100%;
  justify-content: center;
  position: relative;
`;

const MultiSliderContainer = styled.View`
  height: 100%;
`;

const ProgressIndicator = styled.View<{ indicatorPosition: number }>`
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #e74c3c;
  border-width: 2px;
  border-color: #ffffff;
  top: 50%;
  margin-top: -7px;
  margin-left: -7px;
  z-index: 3;
  left: ${props => props.indicatorPosition}px; /* 동적으로 위치 설정 */
`;

const TrackStyle = styled.View`
  height: 4px;
  background-color: #7f8c8d;
  border-radius: 2px;
`;

const SelectedTrackStyle = styled.View`
  background-color: #3498db;
`;

const MarkerStyle = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  background-color: #000000;
  border-width: 2px;
  border-color: #ecf0f1;
  z-index: 2;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.6);
`;

const ModalContent = styled.View`
  width: 80%;
  background-color: #34495e;
  border-radius: 10px;
  padding: 20px;
`;

const ModalTitle = styled.Text`
  font-size: 16px;
  color: #ecf0f1;
  margin-bottom: 15px;
`;

const StyledTextInput = styled.TextInput`
  background-color: #2c3e50;
  color: #ecf0f1;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  text-align: center;
`;

const ModalButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
`;

interface Props {
  startTime: number;
  endTime: number;
  duration: number;
  currentTime: number;
  onValuesChange: (values: number[]) => void;
  onSeek: (time: number) => void;
}

/**
 * RangeControl 컴포넌트는 비디오 편집 구간을 설정하기 위한 UI를 제공합니다.
 * MultiSlider를 사용하여 시작/종료 시간을 조절하고, 현재 재생 위치를 시각적으로 표시합니다.
 * 시간 값을 직접 입력할 수 있는 모달도 포함되어 있습니다.
 * 모든 스타일은 styled-components로 정의되었습니다.
 */
const RangeControl: React.FC<Props> = ({
  startTime,
  endTime,
  duration,
  currentTime,
  onValuesChange,
  onSeek,
}) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTimeType, setEditingTimeType] = useState<EditingTimeType>(null);
  const [tempTimeValue, setTempTimeValue] = useState('');

  // 현재 재생 위치를 슬라이더 위치로 변환
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const indicatorPosition = (sliderLength * progressPercent) / 100;

  // PanGestureHandler를 통해 슬라이더를 터치하여 탐색
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (duration > 0) {
      const locationX = event.nativeEvent.x;
      const clampedX = Math.max(0, Math.min(locationX, sliderLength));
      const seekTime = (clampedX / sliderLength) * duration;
      onSeek(seekTime);
    }
  };

  // 시간 입력 모달 열기
  const openTimeModal = (type: EditingTimeType) => {
    setEditingTimeType(type);
    // 현재 시간을 소수점 한 자리까지 문자열로 변환하여 초기값 설정
    setTempTimeValue(
      type === 'start' ? startTime.toFixed(1) : endTime.toFixed(1),
    );
    setModalVisible(true);
  };

  // 시간 입력 모달에서 '확인' 버튼 클릭 처리
  const handleConfirmTime = () => {
    const newTime = parseFloat(tempTimeValue);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
      if (editingTimeType === 'start') {
        // 시작 시간이 종료 시간을 초과하지 않도록 보정
        onValuesChange([newTime, Math.max(newTime, endTime)]);
      } else if (editingTimeType === 'end') {
        // 종료 시간이 시작 시간보다 작아지지 않도록 보정
        onValuesChange([Math.min(newTime, startTime), newTime]);
      }
    } else {
      // 유효하지 않은 시간 입력 시 경고 (실제 앱에서는 커스텀 모달 사용 권장)
      Alert.alert('유효한 시간을 입력해주세요.');
    }
    setModalVisible(false);
  };

  return (
    <ControlWrapper>
      <LabelText>편집 구간 설정</LabelText>
      <TimeLabelContainer>
        <TouchableOpacity onPress={() => openTimeModal('start')}>
          <TimeTextEditable>시작: {formatTime(startTime)}</TimeTextEditable>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openTimeModal('end')}>
          <TimeTextEditable>종료: {formatTime(endTime)}</TimeTextEditable>
        </TouchableOpacity>
      </TimeLabelContainer>

      <SliderContainer>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onGestureEvent}
        >
          <SliderEventCatcher>
            <MultiSlider
              values={[startTime, endTime]}
              onValuesChange={onValuesChange}
              min={0}
              max={duration > 0 ? duration : 1} // duration이 0일 경우 오류 방지를 위해 최소 1로 설정
              step={0.1}
              allowOverlap={false} // 핸들이 서로 겹치지 않도록
              snapped // 핸들이 스텝에 맞춰 스냅되도록
              sliderLength={sliderLength}
              containerStyle={
                MultiSliderContainer.styledComponentId
                  ? {}
                  : styles.multiSliderContainerPlaceholder
              } // styled-components를 사용하기 위해 더미 스타일 추가
              trackStyle={
                TrackStyle.styledComponentId ? {} : styles.trackStylePlaceholder
              } // styled-components를 사용하기 위해 더미 스타일 추가
              selectedStyle={
                SelectedTrackStyle.styledComponentId
                  ? {}
                  : styles.selectedTrackStylePlaceholder
              } // styled-components를 사용하기 위해 더미 스타일 추가
              markerStyle={
                MarkerStyle.styledComponentId
                  ? {}
                  : styles.markerStylePlaceholder
              } // styled-components를 사용하기 위해 더미 스타일 추가
              enabledTwo // 두 개의 마커 사용
              isMarkersSeparated // 마커가 분리되어 표시되도록
            />
            {/* 현재 재생 위치 인디케이터. 편집 구간 내에 있을 때만 표시 */}
            {currentTime >= startTime && currentTime <= endTime && (
              <ProgressIndicator
                indicatorPosition={indicatorPosition}
                pointerEvents="none"
              />
            )}
          </SliderEventCatcher>
        </PanGestureHandler>
      </SliderContainer>

      {/* 시간 입력 모달 */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={
            ModalContainer.styledComponentId
              ? {}
              : styles.modalContainerPlaceholder
          }
        >
          <ModalContainer>
            <ModalContent>
              <ModalTitle>
                {editingTimeType === 'start' ? '시작' : '종료'} 시간 입력 (초)
              </ModalTitle>
              <StyledTextInput
                value={tempTimeValue}
                onChangeText={setTempTimeValue}
                keyboardType="numeric"
                autoFocus={true}
              />
              <ModalButtonContainer>
                <Button
                  title="취소"
                  onPress={() => setModalVisible(false)}
                  color="#e74c3c"
                />
                <Button title="확인" onPress={handleConfirmTime} />
              </ModalButtonContainer>
            </ModalContent>
          </ModalContainer>
        </KeyboardAvoidingView>
      </Modal>
    </ControlWrapper>
  );
};

// MultiSlider의 style props는 StyleSheet.create 객체나 일반 객체를 기대합니다.
// styled-components로 직접 MultiSlider의 내부 컴포넌트를 스타일링하기 어렵기 때문에
// 임시 placeholder 스타일을 추가하고, 실제 스타일은 styled-components 내에서 처리하도록 합니다.
const styles = StyleSheet.create({
  multiSliderContainerPlaceholder: {
    /* Placeholder */
  },
  trackStylePlaceholder: {
    /* Placeholder */
  },
  selectedTrackStylePlaceholder: {
    /* Placeholder */
  },
  markerStylePlaceholder: {
    /* Placeholder */
  },
  modalContainerPlaceholder: {
    /* Placeholder */
  },
});

export default RangeControl;
