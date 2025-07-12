import React, { useRef, useEffect } from 'react';
import styled from 'styled-components/native';
import { LayoutChangeEvent, Text, Animated } from 'react-native';

import { TrimmerState, PlaybackState } from '../../types';
import VideoPreviewSlot, { VideoPreviewSlotHandles } from './VideoPreviewSlot';

// =================================================================================
// 1. 스타일 컴포넌트 (UI)
// =================================================================================

const PreviewArea = styled.View<{ state: 'max' | 'min' | 'collapsed' }>`
  flex: 1;
  width: 100%;
  background-color: ${({ state }) => (state === 'max' ? '#000000' : '#1a1a1a')};
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 10px;
`;

const OverlappingContainer = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
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
  onSeekComplete: () => void; // [추가]
  setPreviewSlotRef: (id: string, ref: VideoPreviewSlotHandles | null) => void;
  isCollapsed: boolean;
  previewState: 'max' | 'min' | 'collapsed';
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
  onSeekComplete, // [추가]
  setPreviewSlotRef,
  isCollapsed,
  previewState,
}) => {
  // 비디오 뷰의 투명도를 제어하는 애니메이션 값
  const videoOpacity = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;

  useEffect(() => {
    // isCollapsed 상태가 바뀔 때마다 투명도 애니메이션 실행
    Animated.timing(videoOpacity, {
      toValue: isCollapsed ? 0 : 1,
      duration: 150, // 상태 전환 속도
      useNativeDriver: true, // 성능을 위해 네이티브 드라이버 사용
    }).start();
  }, [isCollapsed, videoOpacity]);

  return (
    <PreviewArea onLayout={onLayout} state={previewState}>
      {/* 비디오 프리뷰 (항상 렌더링, isCollapsed에 따라 투명도 조절) */}
      <OverlappingContainer style={{ opacity: videoOpacity }}>
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
                    onSeekComplete={onSeekComplete} // [추가]
                  />
                </SlotContainer>
              );
            })}
          </PreviewGridContainer>
        </VirtualCanvas>
      </OverlappingContainer>

      {/* 접혔을 때 아이콘 (항상 렌더링, isCollapsed에 따라 투명도 조절) */}
      <OverlappingContainer
        style={{
          opacity: videoOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0], // 비디오 투명도와 반대로
          }),
        }}
        pointerEvents={isCollapsed ? 'auto' : 'none'} // 보일 때만 터치 가능
      >
        <Text style={{ fontSize: 24 }}>🐙</Text>
      </OverlappingContainer>
    </PreviewArea>
  );
};

export default PreviewPanel;
