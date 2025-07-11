export class CreatePostDto {
  // ⭐️ author, authorProfileUrl 속성을 제거합니다.
  // author: string;
  // authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
}