import {
  GetParametersByPathCommand,
  SSMClient,
  SSMClientConfig,
  Parameter,
} from '@aws-sdk/client-ssm';
import { Logger } from '@nestjs/common';

export class AwsConfigService {
  private readonly ssmClient: SSMClient;
  private config: Record<string, string> = {};
  private logger = new Logger(AwsConfigService.name);

  constructor() {
    // 환경 변수 유효성 검사 추가 (필수)
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is not set.');
    }
    if (!process.env.AWS_ENV_KEY) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is not set.');
    }
    if (!process.env.AWS_ENV_SECRET_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set.');
    }

    const clientConfig: SSMClientConfig = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ENV_KEY,
        secretAccessKey: process.env.AWS_ENV_SECRET_KEY,
      },
    };

    this.ssmClient = new SSMClient(clientConfig);
  }

  // 로컬 ENV / AWS 데이터 가져올 수 있도록 구성
  public async loadConfig() {
    console.log('load config start');
    try {
      const env = process.env.ENV || 'development';
      // YOUR PATH 부분을 실제 SSM Parameter Store 경로로 변경해야 합니다.
      // 예: /my-application/dev/ 또는 /prod/service-name/
      const path = `/recho/${env}/`;

      console.log('get start');
      const getAllParameters = async (path: string) => {
        // parameters 배열 타입을 Parameter[]로 명시
        let parameters: Parameter[] = [];
        let nextToken: string | undefined;

        do {
          const command = new GetParametersByPathCommand({
            Path: path,
            Recursive: true,
            WithDecryption: true,
            NextToken: nextToken,
          });

          const response = await this.ssmClient.send(command);
          console.log('response');
          console.log(response);
          if (response.Parameters) {
            parameters = parameters.concat(response.Parameters);
          }

          nextToken = response.NextToken;
        } while (nextToken);

        return parameters;
      };

      const result = await getAllParameters(path);
      console.log('get end');
      console.log('server parameters');
      console.log(result);

      if (result) {
        for (const param of result) {
          // param이 Parameter 타입이므로 Name과 Value 속성에 안전하게 접근
          if (param.Name && param.Value) {
            const key = param.Name.replace(path, '');
            this.config[key] = param.Value.replace(/\\\\n/g, '\\n');
          }
        }
      }
    } catch (error) {
      this.logger.error('AWS SSM 접근 실패', error);
      // 설정을 로드하지 못하면 애플리케이션이 제대로 동작할 수 없으므로 에러를 다시 던집니다.
      throw error;
    }
  }

  get(key: string): string {
    // 로컬에서 실행할 경우
    if (process.env.ENV_LOCAL === 'true') {
      return process.env[key] || this.config[key];
    }

    return this.config[key] || process.env[key] || '';
  }

  getConfig() {
    const LOCALHOST = process.env.ENV_LOCALHOST;
    const LOCAL_IP = process.env.ENV_LOCAL_IP;
    const DEV_IP = this.get('dev-ip');
    const FRONT_PORT = this.get('ports/front');
    const BACK_PORT = this.get('ports/back');
    const DB_PORT = this.get('ports/db');



    return {
      DATABASE_URL: this.get('backend/database-url'),
      FRONTEND_URL_IP: this.get('backend/frontend-url-ip'),

      AWS_ACCESS_KEY_ID: this.get('backend/aws-s3-configuration/aws-access-key-id'),
      AWS_SECRET_ACCESS_KEY: this.get('backend/aws-s3-configuration/aws-secret-access-key'),
      AWS_REGION: this.get('backend/aws-s3-configuration/aws-region'),
      AWS_S3_BUCKET: this.get('backend/aws-s3-configuration/aws-s3-bucket'),

      STORAGE_TYPE: this.get('backend/storage-type'),

      RESULTS_PATH: this.get('backend/video/results-path'),
      SOURCE_PATH: this.get('backend/video/source-path'),
      THUMBNAIL_PATH: this.get('backend/video/thumbnail-path'),

      JWT_SECRET: this.get('backend/jwt/jwt-secret'),
      JWT_EXPIRATION_TIME: this.get('backend/jwt/jwt-expiration-time'),
      JWT_REFRESH_SECRET: this.get('backend/jwt/jwt-refresh-secret'),
      JWT_REFRESH_EXPIRATION_TIME: this.get('backend/jwt/jwt-refresh-expiration-time'),
    };
  }
}
