// src/main.ts
import 'reflect-metadata'; // <-- 가장 중요! 이 코드를 최상단에 추가하세요.
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'; // cookie-parser 임포트 추가

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // cookie-parser를 전역 미들웨어로 설정

  // 👇 옵션을 포함하여 CORS 설정 (이 방법을 권장합니다)
  app.enableCors({
    origin: 'http://localhost:5173', // React 앱의 출처를 명시합니다.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 쿠키나 인증 헤더 등을 주고받을 때 필요합니다.
  });

  await app.listen(3000);
}
bootstrap();
