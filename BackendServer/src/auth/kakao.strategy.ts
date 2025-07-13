// src/auth/kakao.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { UserService } from './user/user.service'; // 경로에 맞게 수정해주세요
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    const clientID = configService.get<string>('KAKAO_CLIENT_ID');
    const callbackURL = configService.get<string>('KAKAO_CALLBACK_URL');

    if (!clientID || !callbackURL) {
      throw new Error('카카오 로그인에 필요한 환경변수가 설정되지 않았습니다.');
    }

    super({
      clientID,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ) {
    const { id, _json } = profile; // 카카오 프로필의 닉네임은 사용하지 않음
    const kakao_account = _json.kakao_account;

    if (!kakao_account || !kakao_account.email) {
      throw new UnauthorizedException(
        '카카오 계정에서 이메일 정보를 가져올 수 없습니다. 동의 항목을 확인해주세요.',
      );
    }

    const providerId = id.toString();
    const email = kakao_account.email;

    try {
      // 1. 카카오 ID로 기존 사용자가 있는지 확인
      let user = await this.userService.findByProviderId('kakao', providerId);

      // 2. 기존 사용자가 없으면 새로 가입 처리
      if (!user) {
        let userNickname;
        let isNicknameUnique = false;

        // 2-1. 유니크한 닉네임이 생성될 때까지 반복
        while (!isNicknameUnique) {
          // 6자리 랜덤 숫자 생성
          const randomNumber = Math.floor(100000 + Math.random() * 900000);
          userNickname = `new_${randomNumber}`;

          const existingUserByNickname = await this.userService.findByUsername(
            userNickname,
          );

          // 생성된 닉네임이 DB에 없으면 유니크한 것으로 간주하고 루프 종료
          if (!existingUserByNickname) {
            isNicknameUnique = true;
          }
        }

        // 2-2. 보장된 유니크 닉네임으로 사용자 생성
        user = await this.userService.createWithProvider({
          provider: 'kakao',
          providerId,
          username: userNickname,
          email,
        });
      }

      // 3. 사용자 정보를 반환하여 req.user에 담음
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}