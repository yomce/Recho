import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { UserService } from './user/user.service';
import { ConfigService } from '@nestjs/config'; // ConfigService import 추가

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    // 1. 환경 변수를 변수에 먼저 할당합니다.
    const clientID = configService.get<string>('KAKAO_CLIENT_ID');
    const callbackURL = configService.get<string>('KAKAO_CALLBACK_URL');

    // 2. 변수가 없는 경우, 에러를 발생시켜 서버가 시작되지 않도록 합니다.
    if (!clientID || !callbackURL) {
      throw new Error('카카오 로그인에 필요한 환경변수가 설정되지 않았습니다.');
    }

    // 3. 이제 clientID와 callbackURL은 string 타입임이 보장됩니다.
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
    const { id, username, _json } = profile;
    const kakao_account = _json.kakao_account;

    // [수정] 이메일 정보가 없는 경우에 대한 예외 처리 추가
    if (!kakao_account || !kakao_account.email) {
      throw new UnauthorizedException(
        '카카오 계정에서 이메일 정보를 가져올 수 없습니다. 동의 항목을 확인해주세요.',
      );
    }

    const providerId = id.toString();
    const email = kakao_account.email;

    // 1. 카카오 ID로 기존 사용자가 있는지 확인
    let user = await this.userService.findByProviderId('kakao', providerId);

    // 2. 기존 사용자가 없으면 새로 생성 (자동 회원가입)
    if (!user) {
      user = await this.userService.createWithProvider({
        provider: 'kakao',
        providerId,
        username: username || `kakao_${providerId}`,
        email, // 정상적으로 받아온 이메일을 사용
      });
    }

    // 3. 사용자 정보를 반환하면, Guard가 req.user에 담아줍니다.
    done(null, user);
  }
}
