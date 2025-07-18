// src/auth/password/password.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SendEmailDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;
}

export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
