// src/app.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from './videos/videos.module';
import { AuthModule } from './auth/auth.module'; // <-- AuthModule 임포트
import { UserModule } from './auth/user/user.module'; // <-- UserModule 임포트
// import { ChatModule } from './chat/chat.module'; // <-- ChatModule도 필요할 것이므로 추가

@Module({
  imports: [
    // 1. 전역 설정 모듈
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule,

    // 2. 데이터베이스 연결 설정
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
      }),
    }),

    // 3. 기능별 모듈 등록 (가장 중요!)
    // 이 모듈들이 TypeOrm 연결을 실제로 사용합니다.
    AuthModule,
    UserModule,
    VideosModule,
    // ChatModule, // 채팅 기능이 있다면 ChatModule도 등록해야 합니다.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
