import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { Animated } from 'react-native';
import { TrimmerState, formatTime } from '../../types';

const RULER_HEIGHT = 30;
const TRACK_HEIGHT = 80;
const TRACK_MARGIN = 5;
const PIXELS_PER_SECOND = 60;

// Styled Components (변경 없음)
const TimelineContainer = styled.View`
  flex: 1;
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

const TracksContainerView = styled.View`
  background-color: #ffff00;
  padding-vertical: 10px;
`;

const RulerContainer = styled.View`
  height: ${RULER_HEIGHT}px;
  background-color: #333;
  width: 100%;
`;

const TickContainer = styled.View`
  position: absolute;
  height: 100%;
  justify-content: flex-end;
`;

const TickView = styled.View<{ height: number }>`
  width: 1px;
  background-color: #888;
  height: ${({ height }) => height}px;
`;

const TickLabel = styled.Text`
  position: absolute;
  top: 0;
  left: 2px;
  color: #ccc;
  font-size: 10px;
`;

const TrackWrapper = styled.View`
  height: ${TRACK_HEIGHT}px;
  margin-bottom: ${TRACK_MARGIN}px;
  position: relative;
`;

const TrackContent = styled.TouchableOpacity<{ isActive: boolean }>`
  position: absolute;
  height: 100%;
  background-color: #4a4a4a;
  border-radius: 5px;
  border-width: ${({ isActive }) => (isActive ? '5px' : '0px')};
  border-color: #8e4df6;
  overflow: hidden;
`;

const DebugText = styled.Text`
  color: white;
  font-size: 9px;
  font-weight: bold;
`;

const DebugInfoPanel = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 5px;
  z-index: 200;
  align-items: center;
`;

const TimeIndicatorLine = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #007bff;
  z-index: 101;
`;

const TimeDragHandle = styled(Animated.View)`
  position: absolute;
  top: 7px;
  width: 23px;
  height: 23px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 7px;
  z-index: 102;
  cursor: ew-resize;
`;

export interface TimelineHandles {
  scrollToTime: (time: number) => void;
}

interface TimelineProps {
  trimmers: TrimmerState[];
  globalStartTime: number;
  globalEndTime: number;
  currentTime: number;
  isGloballyPlaying: boolean;
  onPositionChange: (time: number) => void;
  onHeightChange?: (height: number) => void;
  onGlobalStartTimeChange: (time: number) => void;
  onGlobalEndTimeChange: (time: number) => void;
  onTrackPositionChange: (trackId: string, newPosition: number) => void;
  onTrackSelectionChange: (trackId: string | null) => void;
}

const Timeline: React.ForwardRefRenderFunction<
  TimelineHandles,
  TimelineProps
> = (
  {
    trimmers,
    globalStartTime,
    globalEndTime,
    currentTime,
    isGloballyPlaying,
    onPositionChange,
    onHeightChange,
    onGlobalStartTimeChange,
    onGlobalEndTimeChange,
    onTrackPositionChange,
    onTrackSelectionChange,
  },
  ref,
) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  // =================================================================================
  // =================================================================================

  // 편집 데이터 명시 !!!!!!!(중요!!!!!!)

  // =================================================================================
  // =================================================================================

  const startPoint = globalStartTime;
  const endPoint = globalEndTime;
  const startPointThreshold = 0; // 시작점은 0초 이전으로 갈 수 없음
  const endPointThreshold = trimmers[0]?.duration ?? Infinity; // 끝점은 첫 비디오 길이를 초과할 수 없음

  // [추가] 트랙 위치에 따른 동적 핸들 제약 조건
  const { latestTrackStartTime, earliestTrackEndTime } = useMemo(() => {
    if (trimmers.length === 0) {
      return { latestTrackStartTime: Infinity, earliestTrackEndTime: 0 };
    }
    const startPositions = trimmers.map(t => t.timelinePosition);
    const endPositions = trimmers.map(
      t => t.timelinePosition + (t.endTime - t.startTime),
    );
    return {
      latestTrackStartTime: Math.max(...startPositions),
      earliestTrackEndTime: Math.min(...endPositions),
    };
  }, [trimmers]);

  // Notify parent component about the active track change
  useEffect(() => {
    onTrackSelectionChange(activeTrackId);
  }, [activeTrackId, onTrackSelectionChange]);

  const maxTotalDurationRef = useRef(0);
  const totalDuration = React.useMemo(() => {
    if (trimmers.length === 0) {
      return 30; // default minimum duration
    }

    // 1. Calculate the end time of the rightmost clip
    const lastClipEndTime = Math.max(
      ...trimmers.map(t => t.timelinePosition + (t.endTime - t.startTime)),
    );

    // 2. Find the duration of the longest single clip
    const longestClipDuration = Math.max(
      ...trimmers.map(t => t.endTime - t.startTime),
    );

    // 3. The timeline needs to be wide enough for dragging. User suggested 2x longest clip.
    const desiredDragSpace = longestClipDuration * 2;

    // The final duration must accommodate both the actual content and the desired drag space
    return Math.max(30, globalEndTime, lastClipEndTime, desiredDragSpace);
  }, [globalEndTime, trimmers]);

  if (totalDuration > maxTotalDurationRef.current) {
    maxTotalDurationRef.current = totalDuration;
  }

  const handleTrackPress = (trackId: string) => {
    setActiveTrackId(currentActiveId =>
      currentActiveId === trackId ? null : trackId,
    );
  };

  const dragStartPosRef = useRef(0);

  const onTrackPan = (
    event: PanGestureHandlerGestureEvent,
    trackId: string,
  ) => {
    const timeDelta = event.nativeEvent.translationX / PIXELS_PER_SECOND;
    const newPosition = dragStartPosRef.current + timeDelta;
    onTrackPositionChange(trackId, newPosition);
  };

  const onTrackPanStateChange = (
    event: PanGestureHandlerStateChangeEvent,
    trackId: string,
    currentPosition: number,
  ) => {
    if (event.nativeEvent.state === State.BEGAN) {
      dragStartPosRef.current = currentPosition;
    }
  };

  useEffect(() => {
    const requiredHeight =
      RULER_HEIGHT + trimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;
    onHeightChange?.(requiredHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmers.length]);

  // --- Pan Logic Refactor ---
  const panPosition = useRef(new Animated.Value(0)).current;
  const dragTranslationX = useRef(new Animated.Value(0)).current;
  const lastPanPosition = useRef(0);
  const lastDragTranslation = useRef(0);

  useEffect(() => {
    panPosition.addListener(({ value }) => (lastPanPosition.current = value));
    dragTranslationX.addListener(
      ({ value }) => (lastDragTranslation.current = value),
    );
    return () => {
      panPosition.removeAllListeners();
      dragTranslationX.removeAllListeners();
    };
  }, [panPosition, dragTranslationX]);

  const finalTranslateX = Animated.add(panPosition, dragTranslationX);

  const tracksContainerWidth = maxTotalDurationRef.current * PIXELS_PER_SECOND;
  const maxPan = containerWidth > 0 ? containerWidth / 2 : 0;

  const longestClipDuration = React.useMemo(() => {
    if (trimmers.length === 0) return 0;
    return Math.max(...trimmers.map(t => t.endTime - t.startTime));
  }, [trimmers]);
  const leftPadding = longestClipDuration * PIXELS_PER_SECOND;
  const oldMinPan =
    containerWidth - tracksContainerWidth - leftPadding + maxPan;

  // [수정] 플레이헤드가 endPointThreshold를 시각적으로 넘지 못하도록 최소 패닝 값을 재계산
  const minPanBasedOnThreshold =
    containerWidth / 2 - endPointThreshold * PIXELS_PER_SECOND;

  // 두 최소 패닝 값 중 더 제한적인(더 큰) 값을 최종 minPan으로 사용
  const minPan = Math.max(oldMinPan, minPanBasedOnThreshold);

  const clampedPan = finalTranslateX.interpolate({
    inputRange: [minPan, maxPan],
    outputRange: [minPan, maxPan],
    extrapolate: 'clamp',
  });

  // --- Ruler Marks Calculation ---
  const rulerMarks = (() => {
    const duration = maxTotalDurationRef.current;
    if (duration === 0) return [];
    const marks = [];
    const totalSeconds = Math.floor(duration);
    for (let i = 0; i <= totalSeconds; i++) {
      const isMajorTick = i % 5 === 0;
      marks.push({
        position: i * PIXELS_PER_SECOND,
        isMajor: isMajorTick,
        label: isMajorTick ? formatTime(i) : null,
      });
    }
    return marks;
  })();

  // =================================================================================
  // =================================================================================

  // 편집 데이터 명시 !!!!!!!(중요!!!!!!)

  // =================================================================================
  // =================================================================================

  // 글로벌 타임 핸들 드래그 로직
  const dragStartHandleTimeRef = useRef(0);

  const onStartHandleStateChange = (
    event: PanGestureHandlerStateChangeEvent,
  ) => {
    if (event.nativeEvent.state === State.BEGAN) {
      dragStartHandleTimeRef.current = startPoint;
    }
  };

  const onStartHandleDrag = (event: any) => {
    const { translationX } = event.nativeEvent;
    const timeChange = translationX / PIXELS_PER_SECOND;
    const newStartTime = dragStartHandleTimeRef.current + timeChange;
    // 시작점은 (가장 늦게 시작하는 트랙의 시작점)보다 앞으로 갈 수 없다.
    let clampedTime = Math.min(
      endPoint,
      Math.max(newStartTime, startPointThreshold, latestTrackStartTime),
    );
    clampedTime = parseFloat(clampedTime.toFixed(2));
    onGlobalStartTimeChange(clampedTime);
  };

  const onEndHandleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      dragStartHandleTimeRef.current = endPoint;
    }
  };

  const onEndHandleDrag = (event: any) => {
    const { translationX } = event.nativeEvent;
    const timeChange = translationX / PIXELS_PER_SECOND;
    const newEndTime = dragStartHandleTimeRef.current + timeChange;

    // 끝점은 (가장 일찍 끝나는 트랙의 끝점)보다 뒤로 갈 수 없다.
    let clampedTime = Math.max(
      startPoint,
      Math.min(newEndTime, endPointThreshold, earliestTrackEndTime),
    );
    clampedTime = parseFloat(clampedTime.toFixed(2));
    onGlobalEndTimeChange(clampedTime);
  };

  const onTimelinePanStateChange = ({
    nativeEvent,
  }: PanGestureHandlerStateChangeEvent) => {
    if (nativeEvent.state === State.BEGAN) {
      setIsPanning(true);
    } else if (
      [State.END, State.FAILED, 'cancelled'].includes(nativeEvent.state as any)
    ) {
      const newPosition = lastPanPosition.current + lastDragTranslation.current;
      panPosition.setValue(newPosition);
      dragTranslationX.setValue(0);
      setIsPanning(false);
    }
  };

  const onTimelinePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragTranslationX } }],
    { useNativeDriver: false },
  );

  // --- Listener & Auto-scroll ---
  useEffect(() => {
    const listenerId = clampedPan.addListener(({ value }) => {
      if (containerWidth > 0) {
        let centerTime = (containerWidth / 2 - value) / PIXELS_PER_SECOND;
        // 플레이헤드 위치가 임계점을 넘지 않도록 제한
        centerTime = Math.max(
          startPointThreshold,
          Math.min(centerTime, endPointThreshold),
        );
        onPositionChange(centerTime);
      }
    });
    return () => clampedPan.removeListener(listenerId);
  }, [
    clampedPan,
    containerWidth,
    onPositionChange,
    startPointThreshold,
    endPointThreshold,
  ]);

  useEffect(() => {
    // 재생 중이거나, 사용자가 직접 타임라인을 패닝하고 있지 않을 때
    // currentTime(플레이헤드 위치)에 맞춰 타임라인 스크롤 위치(panPosition)를 동기화합니다.
    if (!isPanning && containerWidth > 0 && isGloballyPlaying) {
      const newPanValue = containerWidth / 2 - currentTime * PIXELS_PER_SECOND;
      const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));
      // Animated.Value를 직접 업데이트하여 부드러운 이동을 구현합니다.
      panPosition.setValue(clampedPosition);
    }
  }, [
    currentTime,
    containerWidth,
    panPosition,
    minPan,
    maxPan,
    isPanning,
    isGloballyPlaying,
  ]);

  useImperativeHandle(ref, () => ({
    scrollToTime: (time: number) => {
      if (containerWidth > 0) {
        const newPanValue = containerWidth / 2 - time * PIXELS_PER_SECOND;
        const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));
        panPosition.setValue(clampedPosition);
      }
    },
  }));

  const tracksHeight =
    RULER_HEIGHT + trimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;

  const activeTrack = trimmers.find(t => t.id === activeTrackId);

  return (
    <TimelineContainer
      onLayout={e => {
        if (containerWidth === 0) {
          const newWidth = e.nativeEvent.layout.width;
          setContainerWidth(newWidth);
          const initialPan = newWidth / 2;
          panPosition.setValue(initialPan);
        }
      }}
    >
      <Playhead style={{ height: RULER_HEIGHT + tracksHeight, top: 0 }} />
      <PanGestureHandler
        onGestureEvent={onTimelinePanGestureEvent}
        onHandlerStateChange={onTimelinePanStateChange}
      >
        <Animated.View
          style={{
            transform: [{ translateX: clampedPan }],
            width: tracksContainerWidth + leftPadding,
            marginLeft: -leftPadding,
          }}
        >
          <RulerContainer style={{ paddingLeft: leftPadding }}>
            {rulerMarks.map(mark => (
              <TickContainer
                key={mark.position}
                style={{ left: mark.position }}
              >
                {mark.label && <TickLabel>{mark.label}</TickLabel>}
                <TickView height={mark.isMajor ? 15 : 8} />
              </TickContainer>
            ))}
            {/* Global Time Handles - Now inside Ruler for correct positioning */}
            <TimeIndicatorLine
              style={{
                left: leftPadding + globalStartTime * PIXELS_PER_SECOND,
                height: RULER_HEIGHT + tracksHeight,
              }}
            />
            <PanGestureHandler
              onGestureEvent={onStartHandleDrag}
              onHandlerStateChange={onStartHandleStateChange}
            >
              <TimeDragHandle
                style={{
                  left: leftPadding + globalStartTime * PIXELS_PER_SECOND - 10,
                }}
              />
            </PanGestureHandler>
            <TimeIndicatorLine
              style={{
                left: leftPadding + globalEndTime * PIXELS_PER_SECOND,
                height: RULER_HEIGHT + tracksHeight,
              }}
            />
            <PanGestureHandler
              onGestureEvent={onEndHandleDrag}
              onHandlerStateChange={onEndHandleStateChange}
            >
              <TimeDragHandle
                style={{
                  left: leftPadding + globalEndTime * PIXELS_PER_SECOND - 10,
                }}
              />
            </PanGestureHandler>
          </RulerContainer>
          <TracksContainerView style={{ paddingLeft: leftPadding }}>
            <OverlayMarker
              left={0}
              width={leftPadding + globalStartTime * PIXELS_PER_SECOND}
            />
            <OverlayMarker
              left={leftPadding + globalEndTime * PIXELS_PER_SECOND}
              width={Math.max(
                0,
                totalDuration * PIXELS_PER_SECOND -
                  globalEndTime * PIXELS_PER_SECOND,
              )}
            />
            {trimmers.map(trimmer => {
              const trackWidth =
                (trimmer.endTime - trimmer.startTime) * PIXELS_PER_SECOND;
              const trackLeft = trimmer.timelinePosition * PIXELS_PER_SECOND;
              const isActive = trimmer.id === activeTrackId;

              return (
                <PanGestureHandler
                  key={trimmer.id}
                  enabled={isActive}
                  onGestureEvent={e => onTrackPan(e, trimmer.id)}
                  onHandlerStateChange={e =>
                    onTrackPanStateChange(
                      e,
                      trimmer.id,
                      trimmer.timelinePosition,
                    )
                  }
                >
                  <TrackWrapper>
                    <TrackContent
                      isActive={isActive}
                      onPress={() => handleTrackPress(trimmer.id)}
                      activeOpacity={0.8}
                      style={{
                        width: trackWidth,
                        left: trackLeft,
                      }}
                    />
                  </TrackWrapper>
                </PanGestureHandler>
              );
            })}
          </TracksContainerView>
        </Animated.View>
      </PanGestureHandler>
      <DebugInfoPanel>
        {activeTrack ? (
          <DebugText>
            Active: S: {activeTrack.startTime.toFixed(2)} E:{' '}
            {activeTrack.endTime.toFixed(2)} | Pos:{' '}
            {activeTrack.timelinePosition.toFixed(2)}
          </DebugText>
        ) : (
          <DebugText>트랙을 선택하여 정보를 확인하세요.</DebugText>
        )}
      </DebugInfoPanel>
    </TimelineContainer>
  );
};

export default forwardRef(Timeline);
