// types.ts (코어 타입 및 유틸리티 함수 정의)

import { RouteProp } from '@react-navigation/native';

// EQ 밴드 인터페이스
export interface EQBand {
  id: string;
  frequency: number;
  gain: number;
}

// 미디어 아이템 인터페이스 (비디오, 오디오 등)
export interface MediaItem {
  id: string;
  filename: string;
  uri: string;
  type: string; // 'video' or 'audio'
  size: number; // 바이트 단위 크기
  name?: string; // 선택적 이름
}

// 비디오 트리머 상태 인터페이스
export interface TrimmerState {
  id: string;
  sourceVideo: MediaItem | null; // 원본 비디오 파일
  startTime: number; // 편집 시작 시간 (초)
  endTime: number; // 편집 종료 시간 (초)
  duration: number; // 비디오 전체 길이 (초)
  equalizer: EQBand[]; // 이퀄라이저 설정 배열
  volume: number; // 볼륨 설정 (0.0 ~ 2.0)
  aspectRatio: string; // 현재 적용될 화면 비율 (예: "16:9", "1:1", "original")
  originalAspectRatioValue?: string; // 원본 비디오의 화면 비율 (예: "1.777")
  timelinePosition: number;
}

// FFmpeg 필터에 전달될 트리머 데이터
export interface TrimmerDataForFilter {
  startTime: number;
  endTime: number;
  volume: number;
  aspectRatio: string;
  equalizer: Omit<EQBand, 'id'>[]; // EQ 밴드에서 'id'는 제외
}

// FFmpeg 편집 데이터
export interface EditData {
  trimmers: TrimmerDataForFilter[]; // 편집할 트리머 데이터 배열
}

// 시간 편집 유형 (시작 또는 종료)
export type EditingTimeType = 'start' | 'end' | null;

// SingleVideoEditor 컴포넌트에서 외부로 노출할 핸들러
export interface SingleEditorHandles {
  playVideo: () => void;
  pauseVideo: () => void;
  seekToStart: () => void;
}

// Root Stack Navigator의 모든 가능한 라우트 및 해당 파라미터
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: {
    videos?: MediaItem[];
    total_slots?: number;
    parentVideoId?: string;
    sourceVideos?: Video[];
  };
  Processing: {
    sourceVideos: Video[];
    localVideos: MediaItem[];
  };
  MediaLibrary: undefined;
  FFmpegTest: undefined;
  Web: { url?: string };
  SideBySide: { videoUris: string[] };
  VideoPreview: { videoUri: string };
  NewVideoTest: { localVideoPath: string };
};

// VideoEditScreen의 라우트 prop 타입
export type VideoEditScreenRouteProp = RouteProp<
  RootStackParamList,
  'VideoEdit'
>;

// Video 타입을 RootStackParamList 위에 정의하거나 별도 파일로 분리
export interface Video {
  id: string;
  user_id: string;
  parent_video_id?: string;
  depth: number;
  results_video_key: string;
  source_video_key: string;
  thumbnail_key: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  video_url: string;
  thumbnail_url: string;
}

// --- 유틸리티 함수 (여기서 직접 정의하거나 별도 파일로 분리 가능) ---

// 주파수 포매팅 함수 (예: 60 -> "60Hz", 1000 -> "1kHz")
export const formatFrequency = (freq: number): string => {
  if (freq >= 1000) return `${freq / 1000}kHz`;
  return `${freq}Hz`;
};

// 시간 포매팅 함수 (초를 "MM:SS.S" 형식으로)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toFixed(0).padStart(2, '0')}:${remainingSeconds
    .toFixed(1)
    .padStart(4, '0')}`;
};

// 파일 크기 포매팅 함수 (바이트를 "KB", "MB", "GB" 등으로)
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
