export interface VideoCommentResponse {
  commentId: number;
  videoId: number;
  userId: number;
  content: string;
  createdAt?: Date;
}
