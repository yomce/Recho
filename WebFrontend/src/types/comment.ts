// WebFrontend/src/types/post.ts

import type { User } from '@/stores/authStore';

export interface Comment {
  commentId: number | string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}