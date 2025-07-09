// src/main.ts
import 'reflect-metadata'; // <-- 중요! 이 코드를 최상단에...
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'; // cookie-parser 임포트 추가
import { ConfigService } from '@nestjs/config';
// import * as dotenv from 'dotenv';

// dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService); // ConfigService 인스턴스를 가져옵니다.

  process.env.TZ = 'UTC';

  app.use(cookieParser()); // cookie-parser를 전역 미들웨어로 설정

  const frontendUrl = configService.get<string>('FRONTEND_URL');

  const allowedOrigins: string[] = [];
  if (frontendUrl) allowedOrigins.push(frontendUrl);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 쿠키나 인증 헤더 등을 주고받을 때 필요
    allowedHeaders: 'Content-Type, Accept, Authorization', // 허용할 헤더 목록에 Authorization 추가
    exposedHeaders: 'Authorization', // 클라이언트에서 접근할 수 있도록 헤더 노출
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
