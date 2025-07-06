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
