export enum CONTENT_TYPE {
  VINYL = 'vinyl',
  COMMUNITY = 'community',
  COMMENT = 'comment',
}

export interface LikePayload {
  contentType: CONTENT_TYPE;
  postId: number | string;
}