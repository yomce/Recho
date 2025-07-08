import { Provider } from '@nestjs/common';
import { AwsConfigService } from './aws-config.service';

// 다른 곳에서 주입할 때 사용할 고유한 토큰
export const AWS_CONFIG_SERVICE_TOKEN = 'AWS_CONFIG_SERVICE';

export const awsConfigProvider: Provider = {
  // 위에서 만든 토큰을 Provide의 키로 사용
  provide: AWS_CONFIG_SERVICE_TOKEN,
  // useFactory를 사용하여 비동기 로직 처리
  useFactory: async (): Promise<AwsConfigService> => {
    const configService = new AwsConfigService();
    await configService.loadConfig(); // loadConfig가 끝날 때까지 기다림
    return configService; // 초기화가 완료된 인스턴스를 반환
  },
};
