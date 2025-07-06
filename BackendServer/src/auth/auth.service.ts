// src/auth/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user/user.service'; // 경로 수정
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './user/user.entity'; // 경로 수정

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { id, password } = loginDto;
    const user = await this.userService.findById(id);

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인해주세요.');
    }

    return this._issueTokens(user);
  }

  async socialLogin(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this._issueTokens(user);
  }

  private async _issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { id: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.setCurrentRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(user: User): Promise<{ accessToken: string }> {
    const payload = { id: user.id, username: user.username };
    const newAccessToken = this.jwtService.sign(payload);
    return { accessToken: newAccessToken };
  }

  async logout(id: string): Promise<void> {
    await this.userService.setCurrentRefreshToken(id, null);
  }
}
