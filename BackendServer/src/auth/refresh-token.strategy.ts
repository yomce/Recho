import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    
    super({
    jwtFromRequest: ExtractJwt.fromExtractors([
      (request: Request) => {
        return request.cookies?.refreshToken;
      },
    ]),
    ignoreExpiration: false,
    secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') as string,
    passReqToCallback: true,
  });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies.refreshToken;
    const user = await this.userService.findById(payload.userId);

    
    if (!user || !user.hashedRefreshToken) {
      console.log("검증 실패 원인: DB에 유저 또는 저장된 토큰이 없습니다.");
      throw new UnauthorizedException('인증 정보가 올바르지 않습니다.');
    }

    // DB에 저장된 해시된 토큰과 현재 받은 토큰이 일치하는지 확인
    const isTokenMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    
    console.log("4. Bcrypt 비교 결과 (isTokenMatch):", isTokenMatch);
    
    if (!isTokenMatch) {
      console.log("검증 실패 원인: 토큰이 일치하지 않습니다.");
      throw new UnauthorizedException('인증 정보가 올바르지 않습니다.');
    }

    console.log("--- Refresh Token 검증 성공 ---");

    // 비밀번호와 리프레시 토큰을 제외한 나머지 속성만 result 객체에 담습니다.
    const { password, hashedRefreshToken, ...result } = user;
    return result;
  }
}
