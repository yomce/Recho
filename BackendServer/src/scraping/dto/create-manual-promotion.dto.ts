import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateManualPromotionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  // ✅ subtitle을 선택적 필드로 변경
  @IsString()
  @IsOptional() // subtitle 값이 없어도 유효성 검사를 통과합니다.
  subtitle?: string; // 타입 뒤에 '?'를 붙여 선택적 프로퍼티로 만듭니다.
}
