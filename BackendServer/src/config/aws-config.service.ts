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
    const clientConfig: SSMClientConfig = {
      region: process.env.AWS_REGION || 'ap-northeast-2',
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
          if (response.Parameters) {
            parameters = parameters.concat(response.Parameters);
          }

          nextToken = response.NextToken;
        } while (nextToken);

        return parameters;
      };

      const result = await getAllParameters(path);

      if (result) {
        for (const param of result) {
          if (param.Name && param.Value) {
            const keyPath = param.Name.split('/');
            const finalKey = keyPath[keyPath.length - 1]; // 1. 경로의 마지막 부분 추출 (예: 'jwt-secret')

            const transformedKey = finalKey
              .replace(/-/g, '_') // 2. 대시(-)를 언더스코어(_)로 변경
              .toUpperCase(); // 3. 모두 대문자로 변경 (예: 'JWT_SECRET')

            this.config[transformedKey] = param.Value.replace(/\\\\n/g, '\\n');
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
    console.log('get check');
    console.log(process.env.APP_ENV);
    if (process.env.APP_ENV === 'LOCAL' || process.env.APP_ENV === 'LOCAL_IP') {
      return process.env[key] || this.config[key];
    }

    return this.config[key] || process.env[key] || '';
  }

  getConfig() {
    // 1. 로컬 환경일 경우, process.env 값으로 AWS 설정값을 덮어씁니다.
    if (process.env.APP_ENV === 'LOCAL' || process.env.APP_ENV === 'LOCAL_IP') {
      // this.config 객체(AWS에서 로드된 값)의 모든 키에 대해 반복합니다.
      for (const key in this.config) {
        // 해당 키가 process.env에도 존재하고, 빈 값이 아닐 경우
        if (process.env[key] && process.env[key] !== '') {
          // AWS에서 가져온 값을 로컬 .env 값으로 덮어씁니다.
          this.config[key] = process.env[key];
        }
      }
    }

    if (process.env.APP_ENV === 'LOCAL') {
      this.config['IP'] = process.env.ENV_LOCALHOST || 'localhost';
      this.config['DB_HOST'] = this.config['IP'];
    } else if (process.env.APP_ENV === 'LOCAL_IP') {
      this.config['IP'] = process.env.ENV_LOCAL_IP || 'localhost';
      this.config['DB_HOST'] = this.config['IP'];
    } else {
      this.config['IP'] = this.config['DEV_IP'];
    }

    this.config['FRONTEND_URL'] =
      `${this.config['PROTOCOL']}${this.config['IP']}:${this.config['FRONT_PORT']}`;
    this.config['BACKEND_URL'] =
      `${this.config['PROTOCOL']}${this.config['IP']}:${this.config['BACK_PORT']}`;
    this.config['DB_URL'] =
      `${this.config['PROTOCOL']}${this.config['IP']}:${this.config['DB_PORT']}`;

    this.config['KAKAO_CALLBACK_URL'] =
      this.config['BACKEND_URL'] + this.config['KAKAO_CALLBACK'];

    this.config['GOOGLE_CALLBACK_URL'] =
      this.config['FRONTEND_URL'] + this.config['GOOGLE_CALLBACK'];

    this.config['FRONTEND_CALLBACK_URL'] =
      this.config['FRONTEND_URL'] + this.config['FRONTEND_CALLBACK'];

    //config 변수 확인용
    console.log(this.config);
    return this.config;
  }
}
