// src/posts/dto/post.dto.ts

export class PostDto {
  id: number;
  category: string;
  author: string;
  authorProfileUrl: string;
  createdAt: string; // ISO 8601 format string
  title: string;
  contentSnippet: string;
  thumbnailUrl?: string; // Optional image
  likes: number;
  comments: number;
}