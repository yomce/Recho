// src/app.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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

import { MailerModule } from '@nestjs-modules/mailer';
import { LocationModule } from './map/location.module';
import { ApplicationModule } from './application/application.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule,
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('DB_HOST'),
        port: cs.get<number>('DB_PORT'),
        username: cs.get<string>('DB_USERNAME'),
        password: cs.get<string>('DB_PASSWORD'),
        database: cs.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
        dropSchema: false,
        timezone: 'UTC',
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule], // ConfigModule을 의존성으로 포함
      inject: [ConfigService], // ConfigService를 주입받음
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: 587,
          secure: false, // true for 465, false for other ports
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
