import React, { useRef, useState, useEffect, createRef, useMemo } from 'react';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  LongPressGestureHandler,
  LongPressGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { Animated } from 'react-native';
import { TrimmerState } from '../../types';

const TRACK_HEIGHT = 60;
const TRACK_MARGIN = 5;
const PIXELS_PER_SECOND = 60;

// Styled Components (변경 없음)
const TimelineContainer = styled.View`
  flex: 1;
  justify-content: center;
  background-color: #1c1c1c;
  overflow: hidden;
`;

const Playhead = styled.View`
  position: absolute;
  left: 50%;
  width: 2px;
  background-color: #ffffff;
  z-index: 100;
`;

const OverlayMarker = styled.View<{ left: number; width: number }>`
  position: absolute;
  top: 0;
  height: 100%;
  left: ${({ left }) => left}px;
  width: ${({ width }) => width}px;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  pointer-events: none;
`;

const TracksContainer = styled(Animated.View)`
  background-color: #ffff00;
  padding-vertical: 10px;
`;

const TrackWrapper = styled.View`
  height: ${TRACK_HEIGHT}px;
  margin-bottom: ${TRACK_MARGIN}px;
  position: relative;
`;

const TrackContent = styled.View`
  position: absolute;
  height: 100%;
  background-color: #ff00ff;
  border-radius: 5px;
  justify-content: center;
  align-items: center;
`;

const Handle = styled(Animated.View)`
  position: absolute;
  top: 0;
  width: 16px;
  height: 100%;
  background-color: #ff0000;
  border-radius: 4px;
  z-index: 10;
`;

const MoveHandle = styled(Animated.View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background-color: rgba(80, 80, 80, 0.7);
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  justify-content: center;
  align-items: center;
`;

const TrackText = styled.Text`
  color: white;
  font-weight: bold;
`;

interface TimelineProps {
  trimmers: TrimmerState[];
  globalStartTime: number;
  globalEndTime: number;
  currentTime: number;
  onPositionChange: (time: number) => void;
  onTrimmerUpdate: (
    id: string,
    newState: Partial<Omit<TrimmerState, 'id'>>,
  ) => void;
  onHeightChange?: (height: number) => void;
  isPlaying: boolean; // [추가]
}

const Timeline: React.FC<TimelineProps> = ({
  trimmers,
  globalStartTime,
  globalEndTime,
  currentTime,
  onPositionChange,
  onTrimmerUpdate,
  onHeightChange,
  isPlaying, // [추가]
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [localTrimmers, setLocalTrimmers] = useState(trimmers);
  // --- Refs for simultaneous gesture handling ---
  const trackGestureRefs = useMemo(
    () => trimmers.map(() => [createRef(), createRef(), createRef()]),
    [trimmers.length],
  );
  const flattenedGestureRefs = trackGestureRefs.flat();

  // --- 통합된 제스처 상태 ---
  const [activeGesture, setActiveGesture] = useState<{
    type: 'pan' | 'track' | 'start' | 'end';
    trimmerId?: string;
  } | null>(null);

  const dragStartTrimmerState = useRef<TrimmerState | null>(null);

  const [maxTotalDuration, setMaxTotalDuration] = useState(0);
  const totalDuration = React.useMemo(() => {
    if (localTrimmers.length === 0) {
      return 30; // default minimum duration
    }

    // 1. Calculate the end time of the rightmost clip
    const lastClipEndTime = Math.max(
      ...localTrimmers.map(t => t.timelinePosition + (t.endTime - t.startTime)),
    );

    // 2. Find the duration of the longest single clip
    const longestClipDuration = Math.max(
      ...localTrimmers.map(t => t.endTime - t.startTime),
    );

    // 3. The timeline needs to be wide enough for dragging. User suggested 2x longest clip.
    const desiredDragSpace = longestClipDuration * 2;

    // The final duration must accommodate both the actual content and the desired drag space
    return Math.max(30, globalEndTime, lastClipEndTime, desiredDragSpace);
  }, [globalEndTime, localTrimmers]);

  useEffect(() => {
    if (totalDuration > maxTotalDuration) {
      setMaxTotalDuration(totalDuration);
    }
  }, [totalDuration, maxTotalDuration]);

  useEffect(() => {
    // 부모의 `trimmers` 상태가 변경될 때만 로컬 상태를 동기화합니다.
    // 사용자의 제스처가 끝난 직후, 부모의 상태가 업데이트되기 전에
    // 로컬 상태가 과거로 되돌아가는 것을 방지합니다.
    if (!activeGesture) {
      setLocalTrimmers(trimmers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmers]);

  useEffect(() => {
    const requiredHeight =
      localTrimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;
    onHeightChange?.(requiredHeight);
  }, [localTrimmers.length, onHeightChange]);

  // --- 통합된 Pan 로직 ---
  const pan = useRef(new Animated.Value(0)).current;
  const lastPanValue = useRef(0);

  const tracksContainerWidth = maxTotalDuration * PIXELS_PER_SECOND;
  const maxPan = containerWidth > 0 ? containerWidth / 2 : 0;
  const minPan = containerWidth - tracksContainerWidth + maxPan;

  const clampedPan = pan.interpolate({
    inputRange: [minPan, maxPan],
    outputRange: [minPan, maxPan],
    extrapolate: 'clamp',
  });

  // --- 통합된 제스처 핸들러 ---
  const onTimelinePanStateChange = ({
    nativeEvent,
  }: PanGestureHandlerStateChangeEvent) => {
    if (nativeEvent.state === State.BEGAN) {
      setActiveGesture({ type: 'pan' });
      // [수정] pan의 현재 값을 offset으로 설정
      pan.setOffset(lastPanValue.current);
      pan.setValue(0);
    } else if (
      [State.END, State.FAILED, 'cancelled'].includes(nativeEvent.state as any)
    ) {
      // [수정] flattenOffset으로 최종 위치를 정확하게 반영하고 중복 계산 제거
      pan.flattenOffset();
      setActiveGesture(null);
    }
  };

  const onTimelinePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: pan } }],
    { useNativeDriver: false },
  );

  const handleGenericStateChange = (
    { nativeEvent }: PanGestureHandlerStateChangeEvent,
    trimmer: TrimmerState,
    handleType: 'start' | 'end' | 'track',
  ) => {
    if (nativeEvent.state === State.BEGAN) {
      setActiveGesture({ type: handleType, trimmerId: trimmer.id });
      dragStartTrimmerState.current = { ...trimmer };
    } else if (
      [State.END, State.FAILED, State.CANCELLED].includes(
        nativeEvent.state as any,
      )
    ) {
      if (
        activeGesture?.trimmerId === trimmer.id &&
        activeGesture?.type === handleType
      ) {
        const finalTrimmer = localTrimmers.find(t => t.id === trimmer.id);
        if (finalTrimmer) {
          onTrimmerUpdate(finalTrimmer.id, {
            startTime: finalTrimmer.startTime,
            endTime: finalTrimmer.endTime,
            timelinePosition: finalTrimmer.timelinePosition,
          });
        }
        setActiveGesture(null);
      }
    }
  };

  const onDragGestureEvent = (
    event: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    trimmerId: string,
  ) => {
    if (!activeGesture || !dragStartTrimmerState.current) return;

    const { translationX } = event.nativeEvent;
    if (typeof translationX !== 'number') return;

    const timeChange = translationX / PIXELS_PER_SECOND;
    const startState = dragStartTrimmerState.current;
    let newState: Partial<Omit<TrimmerState, 'id'>> = {};

    if (activeGesture.type === 'start') {
      const newStartTime = Math.max(
        0,
        Math.min(startState.startTime + timeChange, startState.endTime - 0.1),
      );
      const startTimeDelta = newStartTime - startState.startTime;
      newState = {
        startTime: newStartTime,
        timelinePosition: startState.timelinePosition + startTimeDelta,
      };
    } else if (activeGesture.type === 'end') {
      newState = {
        endTime: Math.min(
          startState.duration,
          Math.max(startState.startTime + 0.1, startState.endTime + timeChange),
        ),
      };
    } else if (activeGesture.type === 'track') {
      newState = {
        timelinePosition: Math.max(0, startState.timelinePosition + timeChange),
      };
    }
    setLocalTrimmers(currentTrimmers =>
      currentTrimmers.map(t =>
        t.id === trimmerId ? { ...t, ...newState } : t,
      ),
    );
  };

  // --- 통합된 Listener 및 자동 스크롤 ---
  useEffect(() => {
    const listenerId = clampedPan.addListener(({ value }) => {
      lastPanValue.current = value;
      if (containerWidth > 0) {
        const centerTime = (containerWidth / 2 - value) / PIXELS_PER_SECOND;
        onPositionChange(centerTime);
      }
    });
    return () => clampedPan.removeListener(listenerId);
  }, [clampedPan, containerWidth, onPositionChange]);

  useEffect(() => {
    if (isPlaying && activeGesture === null && containerWidth > 0) {
      const newPanValue = containerWidth / 2 - currentTime * PIXELS_PER_SECOND;
      const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));

      // [수정] Animated.timing 대신 setValue로 직접 위치를 설정하여 재생과 완벽하게 동기화
      pan.setValue(clampedPosition);
    }
  }, [
    currentTime,
    activeGesture,
    containerWidth,
    pan,
    minPan,
    maxPan,
    isPlaying,
  ]);

  const tracksHeight =
    localTrimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;

  return (
    <TimelineContainer
      onLayout={e => {
        if (containerWidth === 0) {
          const newWidth = e.nativeEvent.layout.width;
          setContainerWidth(newWidth);
          const initialPan = newWidth / 2;
          lastPanValue.current = initialPan;
          // [수정] pan의 초기값을 설정
          pan.setValue(initialPan);
        }
      }}
    >
      <Playhead style={{ height: tracksHeight, top: 0 }} />
      <PanGestureHandler
        enabled={activeGesture === null || activeGesture?.type === 'pan'}
        onGestureEvent={onTimelinePanGestureEvent}
        onHandlerStateChange={onTimelinePanStateChange}
        waitFor={flattenedGestureRefs} // [수정] 모든 자식 핸들러 ref를 전달
      >
        <TracksContainer
          style={{
            transform: [{ translateX: clampedPan }],
            width: tracksContainerWidth,
          }}
        >
          <OverlayMarker left={0} width={globalStartTime * PIXELS_PER_SECOND} />
          <OverlayMarker
            left={globalEndTime * PIXELS_PER_SECOND}
            width={Math.max(
              0,
              tracksContainerWidth - globalEndTime * PIXELS_PER_SECOND,
            )}
          />
          {localTrimmers.map((trimmer, index) => {
            const trackWidth =
              (trimmer.endTime - trimmer.startTime) * PIXELS_PER_SECOND;
            const trackLeft = trimmer.timelinePosition * PIXELS_PER_SECOND;
            const isGestureActiveOnThis =
              activeGesture?.trimmerId === trimmer.id;

            const isStartHandleActive =
              isGestureActiveOnThis && activeGesture?.type === 'start';
            const isEndHandleActive =
              isGestureActiveOnThis && activeGesture?.type === 'end';
            const isTrackActive =
              isGestureActiveOnThis && activeGesture?.type === 'track';

            const [startRef, endRef, moveRef] = trackGestureRefs[index];

            return (
              <TrackWrapper key={trimmer.id}>
                <TrackContent
                  style={{
                    width: trackWidth,
                    left: trackLeft,
                    backgroundColor: isTrackActive ? 'red' : '#ff00ff',
                  }}
                >
                  {/* [수정] 트랙 이동을 위한 제스처 핸들러 단순화 */}
                  <PanGestureHandler
                    ref={startRef}
                    onHandlerStateChange={e =>
                      handleGenericStateChange(e, trimmer, 'start')
                    }
                    onGestureEvent={e => onDragGestureEvent(e, trimmer.id)}
                  >
                    <Handle
                      style={{
                        left: 0,
                        backgroundColor: isStartHandleActive ? 'red' : 'white',
                      }}
                    />
                  </PanGestureHandler>
                  <PanGestureHandler
                    ref={endRef}
                    onHandlerStateChange={e =>
                      handleGenericStateChange(e, trimmer, 'end')
                    }
                    onGestureEvent={e => onDragGestureEvent(e, trimmer.id)}
                  >
                    <Handle
                      style={{
                        right: 0,
                        backgroundColor: isEndHandleActive ? 'red' : 'white',
                      }}
                    />
                  </PanGestureHandler>

                  {/* 이동 전용 핸들 추가 */}
                  <PanGestureHandler
                    ref={moveRef}
                    onHandlerStateChange={e =>
                      handleGenericStateChange(e, trimmer, 'track')
                    }
                    onGestureEvent={e => onDragGestureEvent(e, trimmer.id)}
                  >
                    <MoveHandle />
                  </PanGestureHandler>
                </TrackContent>
              </TrackWrapper>
            );
          })}
        </TracksContainer>
      </PanGestureHandler>
    </TimelineContainer>
  );
};

export default Timeline;
