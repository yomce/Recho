import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional, // IsOptional 추가
} from 'class-validator';
import { TRADE_TYPE } from '../entities/used-product.entity';

export class CreateUsedProductDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsEnum(TRADE_TYPE)
  @IsNotEmpty()
  tradeType: TRADE_TYPE;

  @IsString()
  @IsOptional() // 이미지는 선택 사항일 수 있으므로 Optional 처리
  images?: string;

  // location 객체 대신 locationId를 직접 받도록 수정
  @Type(() => Number) // 쿼리 스트링이나 form-data에서 숫자로 변환
  @IsNumber()
  @IsNotEmpty()
  locationId: number;
}
