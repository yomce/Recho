import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('public')
  getPublicConfig() {
    // Parameter Store 등에서 불러온 값 중 공개 가능한 키만 골라서 반환
    return {
      kakaoMapAppKey: this.configService.get<string>('KAKAO_MAP_APP_KEY'),
    };
  }
}
