import React, { forwardRef, useImperativeHandle, useRef, memo } from 'react';
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
  videoId: string;
  sourceVideo: MediaItem | null;
  volume: number;
  isPaused: boolean;
  isMuted?: boolean;
  startTime: number;
  endTime: number;
  onLoad: (id: string, data: OnLoadData) => void;
  onProgress: (id: string, data: OnProgressData) => void;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onSeekComplete: () => void;
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

  const handleLoad = (data: OnLoadData) => props.onLoad(props.videoId, data);
  const handleProgress = (data: OnProgressData) =>
    props.onProgress(props.videoId, data);
  const handlePlay = () => props.onPlay(props.videoId);
  const handlePause = () => props.onPause(props.videoId);
  const handleStop = () => props.onStop(props.videoId);

  return (
    <PreviewWrapper>
      <VideoPlayer
        ref={playerRef}
        source={props.sourceVideo}
        volume={props.volume}
        muted={props.isMuted}
        isPaused={props.isPaused}
        startTime={props.startTime}
        endTime={props.endTime}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSeekComplete={props.onSeekComplete}
      />
    </PreviewWrapper>
  );
});

export default memo(VideoPreviewSlot);
