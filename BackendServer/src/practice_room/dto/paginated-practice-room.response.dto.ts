import { PracticeRoomResponseDto } from './parctice-room.response.dto';

// 커서 기반 페이지네이션의 응답 형식을 정의하는 DTO
export class PaginatedPracticeRoomResponse {
  data: PracticeRoomResponseDto[];

  nextCursor?: {
    lastProductId: number;
    lastCreatedAt: string;
  };

  hasNextPage: boolean;
}
