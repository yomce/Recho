import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components/native';
import { OnLoadData, OnProgressData } from 'react-native-video';
import VideoPlayer, { VideoPlayerHandles } from './VideoPlayer';
import { MediaItem } from '../../types';

// Styled Components
const PreviewWrapper = styled.View`
  width: 100%;
  height: 100%;
  background-color: #1c2833;
  justify-content: center;
  align-items: center;
`;

const EmptySlotContainer = styled.View`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: #2c3e50;
`;

const EmptySlotText = styled.Text`
  font-size: 16px;
  color: #95a5a6;
  font-weight: bold;
`;

// Props 정의
interface VideoPreviewSlotProps {
  sourceVideo: MediaItem | null;
  volume: number;
  isPaused: boolean;
  startTime: number;
  endTime: number;
  onLoad: (data: OnLoadData) => void;
  onProgress: (data: OnProgressData) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

// 상위 컴포넌트에서 제어하기 위한 핸들러 타입
export interface VideoPreviewSlotHandles {
  seek: (time: number) => void;
}

const VideoPreviewSlot = forwardRef<
  VideoPreviewSlotHandles,
  VideoPreviewSlotProps
>((props, ref) => {
  const playerRef = useRef<VideoPlayerHandles>(null);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      playerRef.current?.seek(time);
    },
  }));

  if (!props.sourceVideo) {
    return (
      <EmptySlotContainer>
        <EmptySlotText>비디오 슬롯</EmptySlotText>
      </EmptySlotContainer>
    );
  }

  return (
    <PreviewWrapper>
      <VideoPlayer
        ref={playerRef}
        source={{ uri: props.sourceVideo.uri }}
        volume={props.volume}
        isPaused={props.isPaused}
        startTime={props.startTime}
        endTime={props.endTime}
        onLoad={props.onLoad}
        onProgress={props.onProgress}
        onPlay={props.onPlay}
        onPause={props.onPause}
        onStop={props.onStop}
      />
    </PreviewWrapper>
  );
});

export default VideoPreviewSlot;
