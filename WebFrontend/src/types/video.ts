import type { User } from '@/stores/authStore';

export interface Video {
  id: string;
  user: User;
  parentVideoId?: string;
  depth: number;
  resultsVideoKey: string;
  sourceVideoKey: string;
  thumbnailKey: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  videoUrl: string;
  video_url: string;
  thumbnailUrl: string;
  thumbnail_url: string;
  userLiked: boolean;
}
