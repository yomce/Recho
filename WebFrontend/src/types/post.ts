// WebFrontend/src/types/post.ts

export interface Post {
  postId: number;
  userId: string;
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  userLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ⭐️ 글 작성 시 보낼 데이터 타입 추가
export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  author: string;
  authorProfileUrl?: string;
  thumbnailUrl?: string;
}
