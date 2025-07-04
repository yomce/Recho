import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { PasswordController } from './user/password.controller'; // 경로 수정
import { PasswordService } from './user/password.service';     // 경로 수정
import { MailerModule } from '@nestjs-modules/mailer';
import { KakaoStrategy } from './kakao.strategy'; // KakaoStrategy 추가
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    MailerModule,
    ConfigModule, // ConfigService를 사용하기 위해 ConfigModule을 import
    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
        }),
    }),
  ],
  controllers: [AuthController, PasswordController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, PasswordService, KakaoStrategy, GoogleStrategy], // KakaoStrategy 추가
})
export class AuthModule {}
