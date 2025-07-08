// src/config/env.config.ts
import { AwsConfigService } from './aws-config.service';

export default async () => {
  const awsConfigService = new AwsConfigService();

  try {
    // AWS Parameter Store에서 설정을 비동기적으로 로드합니다.
    await awsConfigService.loadConfig();
    console.log('✅ AWS Config loaded successfully in env.config.');
  } catch (error) {
    // 로드 실패 시 애플리케이션 시작을 막기 위해 에러를 던집니다.
    console.error('🔴 FATAL: Failed to load AWS config. Application cannot start.', error);
    throw error;
  }

  // 로드된 설정 객체를 반환합니다. 이 객체가 ConfigService를 통해 제공됩니다.
  return awsConfigService.getConfig();
};
