export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  likes: number;
  comments: number;
  videoInfo: string; // This might map to a description or title
}
