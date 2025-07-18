import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  memo,
} from 'react';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import { Animated, Easing } from 'react-native';
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
  background-color: rgba(0, 100, 120, 0.3);
  z-index: 50;
  pointer-events: none;
`;

const TracksContainerView = styled.View`
  background-color: #cccccc;
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

const WaveformContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  overflow: hidden;
`;

const WaveformBar = styled.View<{ height: number }>`
  background-color: #ffffff;
  width: 2px;
  border-radius: 1px;
  height: ${({ height }) => height / 1.2}%;
`;

const TrackContent = styled.TouchableOpacity<{ isActive: boolean }>`
  position: absolute;
  height: 100%;
  background-color: ${({ isActive }) => (isActive ? '#8e4df6' : '#000000')};
  border-radius: 20px;
  overflow: hidden;
  elevation: 5;
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
  startPointThreshold: number;
  endPointThreshold: number;
  currentTime: number;
  isGloballyPlaying: boolean;
  onPositionChange: (time: number) => void;
  onHeightChange?: (height: number) => void;
  onGlobalStartTimeChange: (time: number) => void;
  onGlobalEndTimeChange: (time: number) => void;
  onTrackPositionChange: (trackId: string, newPosition: number) => void;
  onTrackSelectionChange: (trackId: string | null) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onTrackDragEnd: () => void; // [추가] 트랙 드래그가 끝났을 때 호출
}

interface WaveformProps {
  data: number[];
}

const Waveform: React.FC<WaveformProps> = React.memo(({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }
  return (
    <WaveformContainer>
      {data.map((amplitude, index) => (
        <WaveformBar key={index} height={Math.max(5, amplitude * 90) + 10} />
      ))}
    </WaveformContainer>
  );
});

// [추가] 트랙 렌더링을 위한 별도의 메모이즈된 컴포넌트
const MemoizedTrack = memo<{
  trimmer: TrimmerState;
  isActive: boolean;
  onTrackPress: (id: string) => void;
  onTrackPan: (event: PanGestureHandlerGestureEvent, trackId: string) => void;
  onTrackPanStateChange: (
    event: PanGestureHandlerStateChangeEvent,
    trackId: string,
    currentPosition: number,
  ) => void;
}>(({ trimmer, isActive, onTrackPress, onTrackPan, onTrackPanStateChange }) => {
  const trackWidth = (trimmer.endTime - trimmer.startTime) * PIXELS_PER_SECOND;
  const trackLeft = trimmer.timelinePosition * PIXELS_PER_SECOND;

  return (
    <PanGestureHandler
      enabled={isActive}
      onGestureEvent={e => onTrackPan(e, trimmer.id)}
      onHandlerStateChange={e =>
        onTrackPanStateChange(e, trimmer.id, trimmer.timelinePosition)
      }
    >
      <TrackWrapper>
        <TrackContent
          isActive={isActive}
          onPress={() => onTrackPress(trimmer.id)}
          activeOpacity={0.8}
          style={{
            width: trackWidth,
            left: trackLeft,
          }}
        >
          {trimmer.waveform && trimmer.waveform.length > 0 && (
            <Waveform data={trimmer.waveform} />
          )}
        </TrackContent>
      </TrackWrapper>
    </PanGestureHandler>
  );
});

const TimelineComponent = forwardRef<TimelineHandles, TimelineProps>(
  (
    {
      trimmers,
      globalStartTime,
      globalEndTime,
      startPointThreshold,
      endPointThreshold,
      currentTime,
      isGloballyPlaying,
      onPositionChange,
      onHeightChange,
      onGlobalStartTimeChange,
      onGlobalEndTimeChange,
      onTrackPositionChange,
      onTrackSelectionChange,
      onDragStateChange,
      onTrackDragEnd, // [추가]
    },
    ref,
  ) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

    // [추가] 핸들러 위치를 위한 애니메이션 값
    const startHandlePosition = useRef(
      new Animated.Value(globalStartTime * PIXELS_PER_SECOND),
    ).current;
    const endHandlePosition = useRef(
      new Animated.Value(globalEndTime * PIXELS_PER_SECOND),
    ).current;

    // [수정] 부모로부터 받은 globalStartTime/EndTime이 변경되면 애니메이션 값을 '즉시' 업데이트
    useEffect(() => {
      startHandlePosition.setValue(globalStartTime * PIXELS_PER_SECOND);
    }, [globalStartTime, startHandlePosition]);

    useEffect(() => {
      endHandlePosition.setValue(globalEndTime * PIXELS_PER_SECOND);
    }, [globalEndTime, endHandlePosition]);

    // =================================================================================
    // =================================================================================

    // 편집 데이터 명시 !!!!!!!(중요!!!!!!)

    // =================================================================================
    // =================================================================================

    // 아마도 글로벌 타임으로 모두 대체 가능 할 듯??
    // const startPoint = globalStartTime;
    // const endPoint = globalEndTime;

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

    const totalDuration = useMemo(() => {
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

    const [maxTotalDuration, setMaxTotalDuration] = useState(
      totalDuration || 30,
    );
    useEffect(() => {
      if (totalDuration > maxTotalDuration) {
        setMaxTotalDuration(totalDuration);
      }
    }, [totalDuration, maxTotalDuration]);

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
      const { translationX } = event.nativeEvent;
      const snapThreshold = 7; // 7px threshold for snapping

      const track = trimmers.find(t => t.id === trackId);
      if (!track) return;

      // Calculate the potential new position in seconds without snapping
      const timeDelta = translationX / PIXELS_PER_SECOND;
      let newPosition = dragStartPosRef.current + timeDelta;

      // Calculate positions in pixels for snapping check
      const newPositionPx =
        (dragStartPosRef.current + timeDelta) * PIXELS_PER_SECOND;
      const playheadPx = currentTime * PIXELS_PER_SECOND;
      const trackDuration = track.endTime - track.startTime;
      const trackDurationPx = trackDuration * PIXELS_PER_SECOND;

      // Check for start snap
      if (Math.abs(newPositionPx - playheadPx) < snapThreshold) {
        newPosition = currentTime;
      }
      // Check for end snap
      else if (
        Math.abs(newPositionPx + trackDurationPx - playheadPx) < snapThreshold
      ) {
        newPosition = currentTime - trackDuration;
      }

      onTrackPositionChange(trackId, newPosition);
    };

    const onTrackPanStateChange = (
      event: PanGestureHandlerStateChangeEvent,
      trackId: string,
      currentPosition: number,
    ) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        onTrackDragEnd(); // [추가] 드래그가 끝나면 콜백 호출
      }

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

    const tracksContainerWidth = maxTotalDuration * PIXELS_PER_SECOND;
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
        dragStartHandleTimeRef.current = globalStartTime;
        onDragStateChange(true);
      } else if (
        event.nativeEvent.state === State.END ||
        event.nativeEvent.state === State.FAILED ||
        event.nativeEvent.state === State.CANCELLED
      ) {
        onDragStateChange(false);
      }
    };

    const onStartHandleDrag = (event: any) => {
      const { translationX } = event.nativeEvent;
      const timeChange = translationX / PIXELS_PER_SECOND;
      let newStartTime = dragStartHandleTimeRef.current + timeChange;

      const snapThreshold = 7; // 7px threshold for snapping
      const pixelDistanceToPlayhead =
        (newStartTime - currentTime) * PIXELS_PER_SECOND;
      if (Math.abs(pixelDistanceToPlayhead) < snapThreshold) {
        newStartTime = currentTime;
      }

      // 시작점은 (가장 늦게 시작하는 트랙의 시작점)보다 앞으로 갈 수 없다.
      let clampedTime = Math.min(
        globalEndTime,
        Math.max(newStartTime, startPointThreshold, latestTrackStartTime),
      );
      clampedTime = parseFloat(clampedTime.toFixed(2));
      console.log('[Timeline] onStartHandleDrag new time:', clampedTime);
      onGlobalStartTimeChange(clampedTime);
    };

    const onEndHandleStateChange = (
      event: PanGestureHandlerStateChangeEvent,
    ) => {
      if (event.nativeEvent.state === State.BEGAN) {
        dragStartHandleTimeRef.current = globalEndTime;
        onDragStateChange(true);
      } else if (
        event.nativeEvent.state === State.END ||
        event.nativeEvent.state === State.FAILED ||
        event.nativeEvent.state === State.CANCELLED
      ) {
        onDragStateChange(false);
      }
    };

    const onEndHandleDrag = (event: any) => {
      const { translationX } = event.nativeEvent;
      const timeChange = translationX / PIXELS_PER_SECOND;
      let newEndTime = dragStartHandleTimeRef.current + timeChange;

      const snapThreshold = 7; // 7px threshold for snapping
      const pixelDistanceToPlayhead =
        (newEndTime - currentTime) * PIXELS_PER_SECOND;
      if (Math.abs(pixelDistanceToPlayhead) < snapThreshold) {
        newEndTime = currentTime;
      }

      // 끝점은 (가장 일찍 끝나는 트랙의 끝점)보다 뒤로 갈 수 없다.
      let clampedTime = Math.max(
        globalStartTime,
        Math.min(newEndTime, endPointThreshold, earliestTrackEndTime),
      );
      clampedTime = parseFloat(clampedTime.toFixed(2));
      console.log('[Timeline] onEndHandleDrag new time:', clampedTime);
      onGlobalEndTimeChange(clampedTime);
    };

    const onTimelinePanStateChange = ({
      nativeEvent,
    }: PanGestureHandlerStateChangeEvent) => {
      if (nativeEvent.state === State.BEGAN) {
        setIsPanning(true);
        // [추가] 사용자가 드래그를 시작하면 진행 중인 애니메이션을 즉시 중지
        panPosition.stopAnimation();
      } else if (
        [State.END, State.FAILED, 'cancelled'].includes(
          nativeEvent.state as any,
        )
      ) {
        // [수정] 드래그가 끝나면 최종 위치를 계산하고 부모에게 명시적으로 알림
        const finalPanPosition =
          lastPanPosition.current + lastDragTranslation.current;
        panPosition.setValue(finalPanPosition);
        dragTranslationX.setValue(0);

        setIsPanning(false);
      }
    };

    const onTimelinePanGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: dragTranslationX } }],
      {
        useNativeDriver: false,
        listener: (event: {
          nativeEvent: PanGestureHandlerGestureEvent['nativeEvent'];
        }) => {
          const { translationX } = event.nativeEvent;
          const currentPanValue = lastPanPosition.current + translationX;
          if (containerWidth > 0) {
            let centerTime =
              (containerWidth / 2 - currentPanValue) / PIXELS_PER_SECOND;
            centerTime = Math.max(
              startPointThreshold,
              Math.min(centerTime, endPointThreshold),
            );
            onPositionChange(centerTime);
          }
        },
      },
    );

    // --- Ruler Marks Calculation ---
    const rulerMarks = useMemo(() => {
      const duration = maxTotalDuration;
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
    }, [maxTotalDuration]);

    // --- Listener & Auto-scroll ---
    useEffect(() => {
      const listenerId = clampedPan.addListener(({ value }) => {
        if (isPanning) return; // 사용자가 드래그 중일 때는 리스너가 개입하지 않음

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
      isPanning,
    ]);

    useEffect(() => {
      // 재생 중이거나, 사용자가 직접 타임라인을 패닝하고 있지 않을 때
      // currentTime(플레이헤드 위치)에 맞춰 타임라인 스크롤 위치(panPosition)를 동기화합니다.
      if (!isPanning && containerWidth > 0 && isGloballyPlaying) {
        const newPanValue =
          containerWidth / 2 - currentTime * PIXELS_PER_SECOND;
        const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));

        // 부드러운 이동을 위해 Animated.timing 사용
        Animated.timing(panPosition, {
          toValue: clampedPosition,
          duration: 200, // onProgress 이벤트(250ms)보다 약간 짧게 설정
          useNativeDriver: true, // 네이티브 스레드에서 애니메이션 처리
          easing: Easing.linear, // 일정한 속도로 이동
        }).start();
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

    // [추가] currentTime이 변경될 때마다 타임라인 스크롤 위치를 즉시 업데이트
    useEffect(() => {
      console.log('[Timeline] currentTime changed to:', currentTime);
      if (!isPanning && containerWidth > 0) {
        const newPanValue =
          containerWidth / 2 - currentTime * PIXELS_PER_SECOND;
        const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));
        console.log('[Timeline] Setting panPosition to:', clampedPosition);
        panPosition.setValue(clampedPosition);
      }
    }, [currentTime, containerWidth, panPosition, minPan, maxPan, isPanning]);

    useImperativeHandle(ref, () => ({
      scrollToTime: (time: number) => {
        if (containerWidth > 0) {
          const newPanValue = containerWidth / 2 - time * PIXELS_PER_SECOND;
          const clampedPosition = Math.max(
            minPan,
            Math.min(newPanValue, maxPan),
          );
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

              {/* [추가] Threshold 시각적 헤드 */}
              <TimeIndicatorLine
                style={{
                  left: leftPadding + startPointThreshold * PIXELS_PER_SECOND,
                  height: RULER_HEIGHT + tracksHeight,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  zIndex: 100,
                }}
              />
              {isFinite(endPointThreshold) && (
                <TimeIndicatorLine
                  style={{
                    left: leftPadding + endPointThreshold * PIXELS_PER_SECOND,
                    height: RULER_HEIGHT + tracksHeight,
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    zIndex: 100,
                  }}
                />
              )}

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
                    left: Animated.add(startHandlePosition, leftPadding - 10),
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
                    left: Animated.add(endHandlePosition, leftPadding - 10),
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
                const isActive = trimmer.id === activeTrackId;
                return (
                  <MemoizedTrack
                    key={trimmer.id}
                    trimmer={trimmer}
                    isActive={isActive}
                    onTrackPress={handleTrackPress}
                    onTrackPan={onTrackPan}
                    onTrackPanStateChange={onTrackPanStateChange}
                  />
                );
              })}
            </TracksContainerView>
          </Animated.View>
        </PanGestureHandler>
        <DebugInfoPanel>
          {activeTrack ? (
            <DebugText>
              Active Track Position: {activeTrack.timelinePosition.toFixed(2)}
            </DebugText>
          ) : (
            <DebugText>트랙을 선택하여 정보를 확인하세요.</DebugText>
          )}
        </DebugInfoPanel>
      </TimelineContainer>
    );
  },
);

export default memo(TimelineComponent);
