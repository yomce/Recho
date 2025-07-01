export interface VideoResponse {
  videoId: number;
  userId: number;
  parentVideoId?: number;
  depth: number;
  resultVideoUrl: string;
  sourceVideoUrl: string;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}
