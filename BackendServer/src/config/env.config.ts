// src/config/env.config.ts
import { AwsConfigService } from './aws-config.service';

export default async () => {
  const awsConfigService = new AwsConfigService();

  try {
    await awsConfigService.loadConfig();
  } catch (error) {
    console.error('loadConfig 실패:', error); // 에러 발생 시 여기서 바로 알 수 있음
    throw error; // 에러를 다시 던져서 애플리케이션 시작을 막음
  }

  const configData = awsConfigService.getConfig();

  return configData;
};
