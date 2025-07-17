import type { Video as ServerVideo } from '@/types/video';

// React Navigation 스택에 대한 타입 정의
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: {
    videos: MediaItem[];
    sourceVideos?: ServerVideo[];
    total_slots?: number;
    parentStartTime?: number;
    parentEndTime?: number;
  };
  MediaLibrary: undefined;
  VideoPreview: { uri: string };
  FFmpegTest: undefined;
  RecordScreen: { video: ServerVideo };
  Processing: {
    localVideos: MediaItem[];
    sourceVideos: ServerVideo[];
    parentVideoId: string;
  };
  Web: { url?: string } | undefined;
};

// 미디어 아이템(로컬 비디오/이미지) 타입
export type MediaItem = {
  id: string;
  uri: string;
  filename: string;
  type: 'video' | 'image';
  size: number;
};

// 아래 타입들은 서버 응답이나 FFmpeg 처리 등 앱 전반에서 사용됩니다.
// 필요에 따라 확장하거나 수정할 수 있습니다.

// 서버에서 받아오는 비디오 메타데이터 타입 (WebFrontend/src/types/video.ts 와 유사)
export type { ServerVideo };

// 비디오 트리머 상태
export interface TrimmerState {
  id: string;
  sourceVideo: ServerVideo;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  isTrimming: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  timelinePosition: {
    start: number;
    end: number;
  };
}

// FFmpeg 편집에 사용될 데이터 구조
export interface EditData {
  id: string;
  uri: string;
  trimmed_start_time: number;
  trimmed_end_time: number;
  volume: number;
  global_start_time: number;
  global_end_time: number;
}

// JWT 토큰 페이로드 타입
export interface CustomJwtPayload {
  id: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
