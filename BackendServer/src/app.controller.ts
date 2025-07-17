import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK) // 반드시 200 OK 응답을 보내도록 설정
  healthCheck() {
    // 지금은 200 상태 코드만 반환되면 충분합니다.
    return { status: 'ok' };
  }
}
