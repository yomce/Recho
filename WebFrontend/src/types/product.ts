export enum STATUS {
  FOR_SALE = 'FOR_SALE',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
}

export enum TRADE_TYPE {
  IN_PERSON,
  DELIVERY,
}

export interface Location {
  locationId: string;
  regionLevel1: string;
  regionLevel2: string;
  address: string;
}

/**
 * DB에 저장되어 있거나 API로부터 받은 상품 데이터의 완전한 형태
 */
export interface UsedProduct {
  readonly productId: number;
  readonly username: string;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  status: STATUS;
  readonly createdAt: string; // JSON 응답에서는 Date가 string으로 직렬화됩니다.
  location: Location;
  tradeType: TRADE_TYPE;
  readonly viewCount: number;
  imageUrl?: string; // 목록에서 썸네일 이미지를 보여주기 위한 선택적 필드
}

/**
 * 상품 등록/수정 폼에서 사용되는 데이터의 형태
 */
export interface UsedProductForm {
  title: string;
  description: string;
  price: string; // 폼 입력값은 보통 문자열
  categoryId: string; // 폼 선택값도 보통 문자열
  tradeType: TRADE_TYPE;
  locationId: string; // 폼에서는 지역의 ID만 관리
  location?: Location;
}

/**
 * 상품 생성을 위해 API로 전송하는 데이터의 형태 (Payload/DTO)
 */
export interface CreateUsedProductPayload {
  title: string;
  description:string;
  price: number; // 전송 전 숫자로 변환
  categoryId: number; // 전송 전 숫자로 변환
  tradeType: TRADE_TYPE;
  locationId: string;
}

/**
 * 커서 기반 페이지네이션 API의 응답 형태를 정의합니다.
 * 백엔드의 PaginatedUsedProductResponse DTO와 일치해야 합니다.
 */
export interface PaginatedUsedProductResponse {
  data: UsedProduct[];
  nextCursor?: {
    lastProductId: number;
    lastCreatedAt: string;
  };
  hasNextPage: boolean;
}