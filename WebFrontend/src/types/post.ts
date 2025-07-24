// WebFrontend/src/types/post.ts

import type { User } from '@/stores/authStore';
import type { Comment } from './comment';

export interface Post {
  user: User;
  postId: number;
  userId: string;
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content:string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  userLiked: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

// 글 작성 시 보낼 데이터 타입 (기존과 동일)
export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  author: string;
  authorProfileUrl?: string;
  thumbnailUrl?: string;
}