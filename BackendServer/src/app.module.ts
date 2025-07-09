// src/app.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from './videos/videos.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './auth/user/user.module';
import { VideoInsertModule } from './video-insert/video-insert.module';
import { ChatModule } from './chat/chat.module';
import { UsedProductModule } from './used_product/used-product.module';
import { PracticeRoomModule } from './practice_room/practice-room.module';
import { EnsembleModule } from './ensemble/ensemble.module';
import { LocationModule } from './map/location.module';
import { ApplicationModule } from './application/application.module';
import { ViewCountModule } from './hooks/view_count/view-count.module';
import loadConfig from './config/env.config';

@Module({
  imports: [
    // ⭐️ 핵심: ConfigModule이 loadConfig를 실행하고 완료될 때까지 기다립니다.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      load: [loadConfig], // 비동기 설정 로더를 여기에 등록
    }),

    MulterModule,
    ScheduleModule.forRoot(),

    // TypeOrmModule은 이제 안전하게 설정 값을 가져올 수 있습니다.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('IP'),
        port: cs.get<number>('DB_PORT'),
        username: cs.get<string>('DB_USERNAME'),
        password: cs.get<string>('DB_PASSWORD'),
        database: cs.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 개발 환경에서는 true, 프로덕션에서는 false 권장
        logging: true,
        dropSchema: false,
        timezone: 'UTC',
      }),
    }),

    // MailerModule도 마찬가지입니다.
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'), // .env 또는 AWS 값
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
      }),
    }),

    // 다른 모듈들은 그대로 둡니다.
    AuthModule,
    UserModule,
    VideosModule,
    VideoInsertModule,
    ChatModule,
    UsedProductModule,
    PracticeRoomModule,
    EnsembleModule,
    LocationModule,
    ApplicationModule,
    ViewCountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
