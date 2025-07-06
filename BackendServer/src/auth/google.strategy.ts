import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    // [수정] super()를 호출하기 전에 환경 변수를 확인하고 할당합니다.
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error('구글 로그인에 필요한 환경변수가 설정되지 않았습니다.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const providerId = id;
    const email = emails?.[0]?.value; // 구글은 이메일 정보를 배열로 줌

    if (!email) {
      // 이메일 동의를 하지 않은 경우 예외 처리
      return done(new Error('구글 계정에서 이메일 정보를 가져올 수 없습니다.'));
    }

    // 1. 구글 ID로 기존 사용자가 있는지 확인
    let user = await this.userService.findByProviderId('google', providerId);

    // 2. 기존 사용자가 없으면 새로 생성 (자동 회원가입)
    if (!user) {
      user = await this.userService.createWithProvider({
        provider: 'google',
        providerId,
        username: name?.givenName || `google_${providerId}`,
        email,
      });
    }

    // 3. 사용자 정보를 반환하면, Guard가 req.user에 담아줍니다.
    done(null, user);
  }
}
