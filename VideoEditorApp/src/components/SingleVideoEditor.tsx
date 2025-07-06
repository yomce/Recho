import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import styled from 'styled-components/native';
import { OnLoadData, OnProgressData } from 'react-native-video';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from 'react-native';

import { TrimmerState, SingleEditorHandles } from '../types'; // 업데이트된 타입 임포트
import VideoPlayer, { VideoPlayerHandles } from './Editor/VideoPlayer'; // 리팩터링된 VideoPlayer
import RangeControl from './Editor/RangeControl'; // 리팩터링된 RangeControl
import AudioControls from './Editor/AudioControls'; // 리팩터링된 AudioControls

// Styled Components 정의
const EditorContainer = styled.View`
  margin-horizontal: 15px;
  margin-bottom: 15px;
  background-color: #34495e;
  border-radius: 12px;
  padding: 10px;
`;

const ControlsSection = styled.View`
  border-top-width: 1px;
  border-top-color: rgba(44, 62, 80, 0.8);
  margin-top: 10px;
  padding-top: 10px;
`;

const EmptySlotContainer = styled.View`
  height: 180px;
  justify-content: center;
  align-items: center;
  background-color: #2c3e50;
  border-radius: 10px;
`;

const EmptySlotText = styled.Text`
  font-size: 16px;
  color: #95a5a6;
  font-weight: bold;
`;

interface Props {
  trimmerState: TrimmerState; // 현재 비디오 에디터의 상태
  onUpdate: (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => void; // 상태 업데이트 콜백
  onVideoLoad: (id: string, data: OnLoadData, aspectRatio: string) => void; // 비디오 로드 완료 콜백
}

/**
 * SingleVideoEditor 컴포넌트는 단일 비디오에 대한 편집 인터페이스를 제공합니다.
 * 비디오 플레이어, 편집 구간 컨트롤, 오디오 컨트롤을 포함합니다.
 * forwardRef를 사용하여 상위 컴포넌트에서 비디오 재생을 제어할 수 있도록 합니다.
 * 모든 스타일은 styled-components로 정의되었습니다.
 */
const SingleVideoEditor = forwardRef<SingleEditorHandles, Props>(
  ({ trimmerState, onUpdate, onVideoLoad }, ref) => {
    const playerRef = useRef<VideoPlayerHandles>(null); // VideoPlayer에 접근하기 위한 ref
    const { id, sourceVideo, startTime, endTime, volume, equalizer, duration } =
      trimmerState;

    const [isPaused, setIsPaused] = useState(true); // 비디오 재생 일시정지 상태
    const [currentTime, setCurrentTime] = useState(0); // 현재 재생 시간

    // useImperativeHandle을 사용하여 상위 컴포넌트에 재생 제어 함수 노출
    useImperativeHandle(ref, () => ({
      playVideo: () => handlePlay(),
      pauseVideo: () => handlePause(),
      seekToStart: () => handleStop(),
    }));

    // 비디오 로드 완료 시 호출되는 핸들러
    const handleLoad = (data: OnLoadData) => {
      // 비디오의 원본 화면 비율 계산
      const ar =
        data.naturalSize.height > 0
          ? (data.naturalSize.width / data.naturalSize.height).toFixed(3)
          : '1.777';
      setCurrentTime(startTime); // 현재 시간을 시작 시간으로 초기화
      onVideoLoad(id, data, ar); // 상위 컴포넌트에 비디오 로드 정보 전달
    };

    // 비디오 재생 진행 중 호출되는 핸들러
    const handleProgress = (data: OnProgressData) => {
      // 현재 재생 시간이 종료 시간을 넘어가면 정지
      if (data.currentTime >= endTime && !isPaused) {
        handleStop();
      } else {
        setCurrentTime(data.currentTime); // 현재 재생 시간 업데이트
      }
    };

    // 비디오 특정 시간으로 탐색
    const handleSeek = (value: number) => {
      // 탐색할 시간을 시작 시간과 종료 시간 범위 내로 제한
      const clampedValue = Math.max(startTime, Math.min(value, endTime));
      playerRef.current?.seek(clampedValue); // VideoPlayer의 seek 함수 호출
      setCurrentTime(clampedValue); // 현재 재생 시간 업데이트
    };

    // 비디오 재생 시작
    const handlePlay = () => {
      // 현재 시간이 편집 구간 밖이면 시작 시간으로 이동
      if (currentTime < startTime || currentTime >= endTime) {
        handleSeek(startTime);
      }
      setIsPaused(false); // 재생 상태로 변경
    };

    // 비디오 일시정지
    const handlePause = () => setIsPaused(true);

    // 비디오 정지 및 시작 시간으로 이동
    const handleStop = () => {
      setIsPaused(true); // 일시정지
      handleSeek(startTime); // 시작 시간으로 탐색
    };

    // 편집 구간 (RangeControl) 변경 핸들러
    const handleRangeChange = (values: number[]) => {
      onUpdate(id, { startTime: values[0], endTime: values[1] }); // 상위 컴포넌트에 시작/종료 시간 업데이트
      // 현재 재생 시간이 새로운 편집 구간 밖이면 시작 시간으로 이동
      if (currentTime < values[0] || currentTime > values[1]) {
        handleSeek(values[0]);
      }
    };

    // 볼륨 변경 핸들러
    const handleVolumeChange = (value: number) => {
      onUpdate(id, { volume: value }); // 상위 컴포넌트에 볼륨 업데이트
    };

    // 이퀄라이저 밴드 게인 변경 핸들러
    const handleEQChange = (bandId: string, gain: number) => {
      // 해당 밴드의 게인만 업데이트된 새로운 이퀄라이저 배열 생성
      const newEQ = equalizer.map(b => (b.id === bandId ? { ...b, gain } : b));
      onUpdate(id, { equalizer: newEQ }); // 상위 컴포넌트에 이퀄라이저 업데이트
    };

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EditorContainer>
          {sourceVideo ? (
            // 비디오 소스가 있으면 편집 UI 렌더링
            <>
              <Text
                style={{
                  color: 'white',
                  paddingBottom: 5,
                  textAlign: 'center',
                }}
              >
                Video ID: {sourceVideo.id}
              </Text>
              <VideoPlayer
                ref={playerRef}
                source={{ uri: sourceVideo.uri }}
                volume={volume}
                isPaused={isPaused}
                startTime={startTime}
                endTime={endTime}
                onLoad={handleLoad}
                onProgress={handleProgress}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
              />

              <ControlsSection>
                <RangeControl
                  startTime={startTime}
                  endTime={endTime}
                  duration={duration}
                  currentTime={currentTime}
                  onValuesChange={handleRangeChange}
                  onSeek={handleSeek}
                />
                <AudioControls
                  volume={volume}
                  equalizer={equalizer}
                  onVolumeChange={handleVolumeChange}
                  onEQChange={handleEQChange}
                />
              </ControlsSection>
            </>
          ) : (
            // 비디오 소스가 없으면 빈 슬롯 메시지 표시
            <EmptySlotContainer>
              <EmptySlotText>비디오 슬롯</EmptySlotText>
              <EmptySlotText>(Slot ID: {trimmerState.id})</EmptySlotText>
            </EmptySlotContainer>
          )}
        </EditorContainer>
      </GestureHandlerRootView>
    );
  },
);

export default SingleVideoEditor;
