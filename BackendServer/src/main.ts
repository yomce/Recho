// src/main.ts
import 'reflect-metadata'; // <-- 중요! 이 코드를 최상단에...
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'; // cookie-parser 임포트 추가
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
// import * as dotenv from 'dotenv';

// dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService); // ConfigService 인스턴스를 가져옵니다.

  process.env.TZ = 'UTC';
  app.setGlobalPrefix('api');

  app.use(cookieParser()); // cookie-parser를 전역 미들웨어로 설정
  app.useGlobalPipes(new ValidationPipe());

  const prodUrl = configService.get<string>('FRONTEND_URL');
  const devUrl = 'http://localhost:5173'; // 개발용 프론트엔드 주소 (포트 확인)

  const allowedOrigins = [prodUrl, devUrl];

  app.enableCors({
    origin: allowedOrigins, // ⬅️ origin을 배열로 전달
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    allowedHeaders: 'Content-Type, Accept, Authorization',
    exposedHeaders: 'Authorization',
  });
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
