// 이 파일을 새로 생성합니다.
import { UsedProduct } from '../entities/used-product.entity';

// 커서 기반 페이지네이션의 응답 형식을 정의하는 DTO
export class PaginatedUsedProductResponse {
  data: UsedProduct[];

  nextCursor?: {
    lastProductId: number;
    lastCreatedAt: string; // JSON으로 변환 시 Date 객체는 ISO 문자열로 표현됩니다.
  };

  hasNextPage: boolean;
}
