import { RouteProp } from '@react-navigation/native';

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

export interface TrimmerState {
  id: string;
  sourceVideo: MediaItem | null;
  startTime: number;
  endTime: number;
  duration: number;
  equalizer: EQBand[];
  volume: number;
  aspectRatio: string;
  originalAspectRatioValue: string;
}

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

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  MediaLibrary: undefined;
  VideoEdit: { videos: MediaItem[] };
  NewVideoTest: undefined;
};
export type VideoEditScreenRouteProp = RouteProp<RootStackParamList, 'VideoEdit'>;

export interface SingleEditorHandles {
  playVideo: () => void;
  pauseVideo: () => void;
  seekToStart: () => void;
}

export type EditingTimeType = 'start' | 'end' | null;