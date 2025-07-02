import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // [수정] 일반 로그인: 이제 공통 토큰 발급 함수를 호출합니다.
  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { id, password } = loginDto;
    const user = await this.userService.findById(id);

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인해주세요.');
    }
    
    // 유저 검증이 끝나면 공통 토큰 발급 함수에 넘깁니다.
    return this._issueTokens(user);
  }

  // [수정] 소셜 로그인: 여기도 공통 토큰 발급 함수를 호출합니다.
  async socialLogin(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    // KakaoStrategy에서 이미 유저를 검증/생성했으므로, 바로 토큰 발급 함수에 넘깁니다.
    return this._issueTokens(user);
  }

  // --- [추가] 토큰 발급 및 저장을 위한 공통 Private 메소드 ---
  private async _issueTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { userId: user.id, username: user.username };

    // 1. 액세스 토큰 생성 (기본 secret, 짧은 만료시간)
    const accessToken = this.jwtService.sign(payload);

    // 2. 리프레시 토큰 생성 (리프레시용 secret, 긴 만료시간)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
    });

    // 3. 생성된 리프레시 토큰을 DB에 (해싱하여) 저장
    // 현재 RefreshTokenStrategy에서 bcrypt.compare를 사용하고 있으므로, 여기서도 해싱해야 합니다.
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.setCurrentRefreshToken(user.id, hashedRefreshToken);

    // 4. 두 토큰을 모두 반환
    return { accessToken, refreshToken };
  }

  // ... refreshAccessToken, logout 메소드는 기존과 동일 ...
  async refreshAccessToken(user: User): Promise<{ accessToken: string }> {
    const payload = { userId: user.id, username: user.username };
    const newAccessToken = this.jwtService.sign(payload);
    return { accessToken: newAccessToken };
  }

  async logout(userId: string): Promise<void> {
  await this.userService.setCurrentRefreshToken(userId, null);
}
}