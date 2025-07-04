import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport'; // AuthGuard import
import { User } from './user/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('login attempt');
    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    // 리프레시 토큰을 HttpOnly 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // 프로덕션 환경에서는 true
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초 단위)
    });

    // 액세스 토큰은 JSON 본문으로 반환
    return { accessToken };
  }

   @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  // ↓↓↓↓↓↓ req: Request를 req: RequestWithUser로 변경합니다. ↓↓↓↓↓↓
  async refresh(@Req() req: RequestWithUser) {
    // 이제 req는 user 속성을 가진 것으로 타입스크립트가 인지합니다.
    const user = req.user; // 'as User' 타입 단언이 더 이상 필요 없습니다.
    return this.authService.refreshAccessToken(user);
  }

  @UseGuards(AuthGuard('jwt')) // 액세스 토큰으로 사용자를 식별해야 하므로 'jwt' 가드 사용
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req()
    req: RequestWithUser,
    @Res({ passthrough: true })
    res: Response,
  ) {
    // 1. DB에서 리프레시 토큰을 무효화합니다.
    await this.authService.logout(req.user.id);
    
    // 2. 클라이언트의 쿠키를 삭제합니다.
    res.clearCookie('refreshToken');

    return { message: '로그아웃 성공' };
  }

   // [추가] 1. 카카오 로그인 시작 API
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {
    // 이 함수는 실행되지 않습니다. Guard가 사용자를 카카오 로그인 페이지로 리디렉션합니다.
  }

  // [추가] 2. 카카오 로그인 콜백 API
   @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('카카오 인증 정보가 없습니다.');
    }
    const user = req.user as User;

    // 1. socialLogin을 통해 두 토큰을 모두 받습니다.
    const { accessToken, refreshToken } = await this.authService.socialLogin(user);

    // 2. 일반 로그인과 동일하게, 리프레시 토큰은 HttpOnly 쿠키로 설정합니다.
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // 프로덕션에서는 true로 변경
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
    
    // 3. 액세스 토큰은 프론트엔드의 콜백 페이지로 리디렉션하며 전달합니다.
    res.redirect(`http://localhost:5173/auth/callback?token=${accessToken}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Guard가 사용자를 구글 로그인 페이지로 리디렉션합니다.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // 카카오 콜백과 로직이 완전히 동일합니다.
    if (!req.user) {
      throw new UnauthorizedException('구글 인증 정보가 없습니다.');
    }
    const user = req.user as User;
    const { accessToken, refreshToken } = await this.authService.socialLogin(user);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, /*...*/ });
    res.redirect(`http://localhost:5173/auth/callback?token=${accessToken}`);
  }


}