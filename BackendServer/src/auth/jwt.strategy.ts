import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더의 Bearer Token에서 JWT를 추출
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: configService.get<string>('JWT_SECRET') as string, // 토큰 서명 검증에 사용할 비밀 키
    });
  }

  // JWT 검증이 완료되면 실행되는 메서드
  async validate(payload: any) {
    const user = await this.userService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }
    // 여기서 반환된 값은 요청(request) 객체의 user 속성에 저장됩니다. (예: req.user)
    console.log('[1. JwtStrategy] DB에서 조회한 user:', user);
    
    return { id: user.id, name: user.username };  }
}