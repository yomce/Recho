// src/auth/user/dto/create-user.dto.ts
import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  // 👇👇👇 이 부분을 추가해 주세요. 👇👇👇
  @IsEmail() // 이메일 형식인지 검증합니다.
  @IsNotEmpty()
  email: string;
  // 👆👆👆 여기까지 추가 👆👆👆

  @IsString()
  @IsNotEmpty()
  @MinLength(4) // 최소 4자 이상
  password: string;
}