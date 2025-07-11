import React, { useRef, useState, useEffect } from 'react';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
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

interface TimelineProps {
  trimmers: TrimmerState[];
  globalStartTime: number;
  globalEndTime: number;
  currentTime: number;
  onPositionChange: (time: number) => void;
  onHeightChange?: (height: number) => void;
  isPlaying: boolean; // [추가]
}

const Timeline: React.FC<TimelineProps> = ({
  trimmers,
  globalStartTime,
  globalEndTime,
  currentTime,
  onPositionChange,
  onHeightChange,
  isPlaying, // [추가]
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const [maxTotalDuration, setMaxTotalDuration] = useState(0);
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

  useEffect(() => {
    if (totalDuration > maxTotalDuration) {
      setMaxTotalDuration(totalDuration);
    }
  }, [totalDuration, maxTotalDuration]);

  useEffect(() => {
    const requiredHeight = trimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;
    onHeightChange?.(requiredHeight);
  }, [trimmers.length, onHeightChange]);

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
  const minPan = containerWidth - tracksContainerWidth + maxPan;

  const clampedPan = finalTranslateX.interpolate({
    inputRange: [minPan, maxPan],
    outputRange: [minPan, maxPan],
    extrapolate: 'clamp',
  });

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
        const centerTime = (containerWidth / 2 - value) / PIXELS_PER_SECOND;
        onPositionChange(centerTime);
      }
    });
    return () => clampedPan.removeListener(listenerId);
  }, [clampedPan, containerWidth, onPositionChange]);

  useEffect(() => {
    if (isPlaying && !isPanning && containerWidth > 0) {
      const newPanValue = containerWidth / 2 - currentTime * PIXELS_PER_SECOND;
      const clampedPosition = Math.max(minPan, Math.min(newPanValue, maxPan));
      panPosition.setValue(clampedPosition);
    }
  }, [
    currentTime,
    containerWidth,
    panPosition,
    minPan,
    maxPan,
    isPlaying,
    isPanning,
  ]);

  const tracksHeight = trimmers.length * (TRACK_HEIGHT + TRACK_MARGIN) + 20;

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
      <Playhead style={{ height: tracksHeight, top: 0 }} />
      <PanGestureHandler
        onGestureEvent={onTimelinePanGestureEvent}
        onHandlerStateChange={onTimelinePanStateChange}
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
          {trimmers.map(trimmer => {
            const trackWidth =
              (trimmer.endTime - trimmer.startTime) * PIXELS_PER_SECOND;
            const trackLeft = trimmer.timelinePosition * PIXELS_PER_SECOND;

            return (
              <TrackWrapper key={trimmer.id}>
                <TrackContent
                  style={{
                    width: trackWidth,
                    left: trackLeft,
                    backgroundColor: '#ff00ff',
                  }}
                />
              </TrackWrapper>
            );
          })}
        </TracksContainer>
      </PanGestureHandler>
    </TimelineContainer>
  );
};

export default Timeline;
