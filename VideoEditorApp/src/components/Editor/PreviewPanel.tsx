import React from 'react';
import styled from 'styled-components/native';
import { LayoutChangeEvent, View } from 'react-native';

import { TrimmerState, PlaybackState } from '../../types';
import VideoPreviewSlot, { VideoPreviewSlotHandles } from './VideoPreviewSlot';

// =================================================================================
// 1. 스타일 컴포넌트 (UI)
// =================================================================================

const PreviewArea = styled.View`
  flex: 1;
  width: 100%;
  background-color: #1a1a1a;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 10px;
`;

// FFmpeg 최종 결과물과 동일한 가상 캔버스 크기 및 패딩 설정
const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;
const PADDING = 20;
const CORNER_RADIUS = 15;

const VirtualCanvas = styled.View<{ scale: number }>`
  width: ${VIRTUAL_WIDTH}px;
  height: ${VIRTUAL_HEIGHT}px;
  background-color: #000000;
  justify-content: center;
  align-items: center;
  transform: ${({ scale }) => `scale(${scale})`};
  padding: ${PADDING}px;
  overflow: hidden;
`;

const PreviewGridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: ${PADDING}px;
`;

const SlotContainer = styled.View<{ width: number; height: number }>`
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  background-color: #000000;
  border-radius: ${CORNER_RADIUS}px;
  overflow: hidden;
`;

// =================================================================================
// 2. 타입 정의 (Props)
// =================================================================================

interface PreviewPanelProps {
  trimmers: TrimmerState[];
  playbackStates: Record<string, PlaybackState>;
  previewScale: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onVideoLoad: (id: string, data: any) => void;
  onProgress: (id: string, data: any) => void;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  setPreviewSlotRef: (id: string, ref: VideoPreviewSlotHandles | null) => void;
}

// =================================================================================
// 3. 메인 컴포넌트
// =================================================================================

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  trimmers,
  playbackStates,
  previewScale,
  onLayout,
  onVideoLoad,
  onProgress,
  onPlay,
  onPause,
  onStop,
  setPreviewSlotRef,
}) => {
  return (
    <PreviewArea onLayout={onLayout}>
      <VirtualCanvas scale={previewScale}>
        <PreviewGridContainer>
          {trimmers.map((trimmer, index) => {
            const numSlots = trimmers.length;
            const isOddLayout = numSlots % 2 !== 0;
            const isLastItem = index === numSlots - 1;

            const contentWidth = VIRTUAL_WIDTH - PADDING * 2;
            const baseSlotWidth = (contentWidth - PADDING) / 2;

            let slotWidth: number;
            if (isOddLayout && isLastItem) {
              slotWidth = contentWidth;
            } else {
              slotWidth = baseSlotWidth;
            }
            const slotHeight = slotWidth * (3 / 4);

            return (
              <SlotContainer
                key={trimmer.id}
                width={slotWidth}
                height={slotHeight}
              >
                <VideoPreviewSlot
                  ref={ref => setPreviewSlotRef(trimmer.id, ref)}
                  sourceVideo={trimmer.sourceVideo}
                  volume={trimmer.volume}
                  isPaused={playbackStates[trimmer.id]?.isPaused ?? true}
                  startTime={trimmer.startTime}
                  endTime={trimmer.endTime}
                  onLoad={data => onVideoLoad(trimmer.id, data)}
                  onProgress={data => onProgress(trimmer.id, data)}
                  onPlay={() => onPlay(trimmer.id)}
                  onPause={() => onPause(trimmer.id)}
                  onStop={() => onStop(trimmer.id)}
                />
              </SlotContainer>
            );
          })}
        </PreviewGridContainer>
      </VirtualCanvas>
    </PreviewArea>
  );
};

export default PreviewPanel;
