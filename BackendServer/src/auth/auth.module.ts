import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from './user/user.module'; // UserService를 사용하기 위해 UserModule import

import { JwtModule } from '@nestjs/jwt'; // JwtModule import
import { PassportModule } from '@nestjs/passport'; // PassportModule import
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokenStrategy } from './refresh-token.strategy'; // RefreshTokenStrategy import

@Module({
  imports: [UserModule,
            PassportModule,
            JwtModule.registerAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    secret: configService.get<string>('JWT_SECRET'),
                    signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'), },
                }),
            }),
  ], // UserService를 AuthService에서 주입받아 사용하므로 UserModule을 imports 해야함
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
})
export class AuthModule {}