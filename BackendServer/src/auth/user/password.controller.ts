// src/auth/password/password.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PasswordService } from './password.service';
import { SendEmailDto, VerifyCodeDto, ResetPasswordDto } from './dto/password.dto';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('send-email')
  @HttpCode(200)
  async sendEmail(@Body() dto: SendEmailDto): Promise<{ message: string }> {
    await this.passwordService.sendVerificationEmail(dto.username, dto.email);
    return { message: '인증 이메일이 발송되었습니다.' };
  }

  @Post('verify-code')
  @HttpCode(200)
  async verifyCode(@Body() dto: VerifyCodeDto): Promise<{ message: string }> {
    await this.passwordService.verifyCode(dto.email, dto.code);
    return { message: '인증에 성공했습니다.' };
  }

  @Post('reset')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordService.resetPassword(dto.email, dto.code, dto.password);
    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }
}