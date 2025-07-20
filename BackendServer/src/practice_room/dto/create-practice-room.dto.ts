import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreatePracticeRoomDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional() // 이미지는 선택 사항일 수 있으므로 Optional 처리
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  imageIds?: number[];

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  locationId: number;
}
