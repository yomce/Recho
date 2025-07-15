import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min, IsString, IsEnum } from 'class-validator';
import { SKILL_LEVEL } from '../entities/recruit-ensemble.entity';

export class PaginationQueryRecruitEnsembleDto {
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
  lastPostId?: number; // <<< last_product_id -> lastProductId (camelCase로 변경)

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCreatedAt?: Date; // <<< last_create_at -> lastCreatedAt (camelCase로 변경)
}

export class FilterRecruitEnsembleDto extends PaginationQueryRecruitEnsembleDto {
  @IsOptional()
  @IsString()
  instrument?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(SKILL_LEVEL)
  skillLevel?: SKILL_LEVEL;

  @IsOptional()
  @IsDate()
  eventDate?: Date; 
}