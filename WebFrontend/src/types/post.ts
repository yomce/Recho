// 기존 Post 인터페이스
export interface Post {
  id: number;
  author: string;
  // ...
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