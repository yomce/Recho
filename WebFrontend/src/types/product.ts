// 👇 백엔드 ENUM 과 일치화
export enum STATUS {
  FOR_SALE = 'FOR_SALE',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
}

// 프론트 TEXT 필터 렌더링을 위한 이름
export const STATUS_TEXT = {
  FOR_SALE: '판매중',
  IN_PROGRESS: '예약중',
  SOLD: '판매완료',
} as const;

// 👇 백엔드 ENUM 과 일치화
export enum TRADE_TYPE {
  IN_PERSON = 'IN_PERSON',
  DELIVERY = 'DELIVERY',
}

// 프론트 ENUM - 백엔드 Number 타입
export enum ProductCategory {
  BASS = 1,
  ELECTRIC = 2,
  CLASSIC = 3,
  ACOUSTIC = 4,
}

// 프론트 TEXT 필터 렌더링을 위한 이름
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.BASS]: '베이스기타',
  [ProductCategory.ELECTRIC]: '일렉기타',
  [ProductCategory.CLASSIC]: '클래식기타',
  [ProductCategory.ACOUSTIC]: '통기타',
};

// 카테고리 id to label 역매핑 (필요시)
export const CATEGORY_LABEL_TO_ID: Record<string, ProductCategory> = Object.fromEntries(
  Object.entries(PRODUCT_CATEGORY_LABELS).map(([id, name]) => [name, Number(id)])
);

export interface Location {
  locationId: string;
  regionLevel1: string;
  regionLevel2: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * DB에 저장되어 있거나 API로부터 받은 상품 데이터의 완전한 형태
 */
export interface UsedProduct {
  readonly productId: number;
  readonly id: string;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  status: STATUS;
  readonly createdAt: string; // JSON 응답에서는 Date가 string으로 직렬화됩니다.
  location: Location;
  tradeType: TRADE_TYPE;
  readonly viewCount: number;
  imageUrl?: string[]; // 목록에서 썸네일 이미지를 보여주기 위한 선택적 필드
  imageIds?: number[]; // 이미지 ID 배열
}

/**
 * 상품 등록/수정 폼에서 사용되는 데이터의 형태
 */
export interface UsedProductForm {
  title: string;
  description: string;
  price: string; // 폼 입력값은 보통 문자열
  categoryId: number; // 폼 선택값도 보통 문자열
  tradeType: TRADE_TYPE;
  locationId: string; // 폼에서는 지역의 ID만 관리
  location?: Location;
  imageIds?: number[];
  videoId?: string;
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
  imageIds: number[]; // 이미지 ID 배열
  videoId?: string;
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

// 프론트에서 비디오 목록 응답으로 쓸 타입
export interface VideoPreview {
  id: string;
  thumbnailUrl: string;
}

// 프론트 비디오 썸네일 조립용
export const S3_BASE = 'https://vinyl-media.s3.ap-northeast-2.amazonaws.com/';
export const getThumbnailUrl = (key: string) => `${S3_BASE}${key}`;
