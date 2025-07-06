// src/auth/password/password.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

interface VerificationInfo {
  code: string;
  expiresAt: number;
  verified: boolean;
}

@Injectable()
export class PasswordService {
  private verificationCodes = new Map<string, VerificationInfo>();

  constructor(
    private readonly userService: UserService,
    private readonly mailerService: MailerService,
  ) {}

  async sendVerificationEmail(id: string, email: string): Promise<void> {
    const user = await this.userService.findById(id);
    if (!user || user.email !== email) {
      throw new NotFoundException('일치하는 사용자 정보를 찾을 수 없습니다.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 후 만료

    this.verificationCodes.set(email, { code, expiresAt, verified: false });

    await this.mailerService.sendMail({
      to: email,
      subject: '[Recho] 비밀번호 재설정 인증 코드입니다.',
      html: `인증 코드는 <b>${code}</b> 입니다. 5분 내에 입력해주세요.`,
    });
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const info = this.verificationCodes.get(email);
    if (!info || info.expiresAt < Date.now() || info.code !== code) {
      throw new BadRequestException('인증 코드가 유효하지 않습니다.');
    }
    info.verified = true; // 인증 완료 상태로 변경
  }

  async resetPassword(
    email: string,
    code: string,
    newPass: string,
  ): Promise<void> {
    const info = this.verificationCodes.get(email);
    // 코드가 유효한지, 그리고 '인증 완료' 상태인지 함께 확인
    if (!info || info.code !== code || !info.verified) {
      throw new UnauthorizedException('인증 절차를 다시 진행해주세요.');
    }
    if (info.expiresAt < Date.now()) {
      throw new BadRequestException(
        '인증 세션이 만료되었습니다. 다시 시도해주세요.',
      );
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.userService.updatePassword(user.id, hashedPassword);

    this.verificationCodes.delete(email); // 사용된 코드는 삭제
  }
}
