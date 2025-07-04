export interface Location {
  locationId: string;
  regionLevel1: string;
  regionLevel2: string;
  address: string;
  lat: number;
  lng: number;
}

// -- DB에 저장된 상품 데이터의 완전한 형태 -- 
export interface PracticeRoom {
  readonly postId: number;
  readonly userId: number;
  user_name: string;
  title: string;
  description: string;
  readonly createdAt: string;
  readonly viewCount: number;
  location: Location;
  imageUrl?: string;
}

// -- 합주실 등록 / 수정 폼에서 사용되는 데이터 형태 -- 
export interface PracticeRoomType {
  title: string;
  description: string;
  locationId: string;
  image: File[];
}

// -- 합주실 게시글 생성을 위한 API 전송 데이터의 형태 (Payload/DTO) --
export interface CreatePracticeRoomPayload {
  title: string;
  description: string;
  locationId: string;
}

// -- 커서 기반 페이지네이션 API 응답 형태 -- 
export interface PaginatedPracticeRoomResponse {
  data: PracticeRoom[];
  nextCursor?: {
    lastProductId: number;
    lastCreatedAt: string;
  };
  hasNextPage: boolean;
}