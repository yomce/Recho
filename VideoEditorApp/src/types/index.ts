// src/types/index.ts

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// --- 기본 타입 ---
export interface MediaItem {
  id: string;
  filename: string;
  uri: string;
}

export interface EQBand {
  id: string;
  frequency: number;
  gain: number;
}

// --- 핵심 상태 타입 ---
// 각 비디오 편집기의 전체 상태를 정의
export interface TrimmerState {
  id: string;
  sourceVideo: MediaItem | null;
  startTime: number;
  endTime: number;
  duration: number; // 원본 영상 길이
  equalizer: EQBand[];
  volume: number;
  aspectRatio: string; // 'original' 또는 '16:9' 등
  originalAspectRatioValue: string; // 원본 비율값 (예: '1.777')
}

// --- FFmpeg 필터 생성을 위한 데이터 타입 ---
export interface TrimmerDataForFilter {
  startTime: number;
  endTime: number;
  volume: number;
  aspectRatio: string;
  equalizer: Omit<EQBand, 'id'>[];
}

export interface EditData {
  trimmers: TrimmerDataForFilter[];
}

// --- 내비게이션 타입 ---
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: { videos: MediaItem[] };
  MediaLibrary: undefined;
};
export type VideoEditScreenRouteProp = RouteProp<RootStackParamList, 'VideoEdit'>;

// --- 컴포넌트 핸들 타입 ---
// 부모가 자식 컴포넌트의 함수를 호출하기 위한 타입
export interface SingleEditorHandles {
  playVideo: () => void;
  pauseVideo: () => void;
  seekToStart: () => void;
}