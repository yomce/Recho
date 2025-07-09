// src/posts/dto/create-post.dto.ts
export class CreatePostDto {
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
}