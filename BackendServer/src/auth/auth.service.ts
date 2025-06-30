import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt'; // JwtService import
import { ConfigService } from '@nestjs/config'; // ConfigService import
import { User } from './user/user.entity'; // User 타입 import


@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService, // ConfigService 주입

  ) {}

   async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { id, password } = loginDto;
    const user = await this.userService.findById(id);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인해주세요.');
    }

    // 1. 액세스 토큰 생성
    const accessTokenPayload = { userId: user.id, username: user.username };
    const accessToken = this.jwtService.sign(accessTokenPayload); // 기본 secret과 만료시간 사용

    // 2. 리프레시 토큰 생성
    const refreshTokenPayload = { userId: user.id };

    
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
    });

    // 3. 생성된 리프레시 토큰을 DB에 (해싱하여) 저장
    await this.userService.setCurrentRefreshToken(user.id, refreshToken);

    // 4. 두 토큰을 모두 반환
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(user: User): Promise<{ accessToken: string }> {
    // validate 메소드를 통과한 user 객체를 받습니다.
    // 새로운 액세스 토큰을 생성합니다.
    const payload = { userId: user.id, name: user.username };
    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
    });

    return { accessToken: newAccessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.removeRefreshToken(userId);
  }
}