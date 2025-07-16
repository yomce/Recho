import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DeletePromotionDto {
  @IsArray()
  @IsString({ each: true }) // 배열의 각 요소가 문자열인지 확인
  @IsNotEmpty()
  ids: string[];
}
