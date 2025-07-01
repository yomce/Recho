import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryUsedProductDto {
  // 기본값은 DTO가 아닌 사용하는 곳(Controller)에서 설정하는 것이 더 명확합니다.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lastProductId?: number; // <<< last_product_id -> lastProductId (camelCase로 변경)

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCreatedAt?: Date; // <<< last_create_at -> lastCreatedAt (camelCase로 변경)
}
