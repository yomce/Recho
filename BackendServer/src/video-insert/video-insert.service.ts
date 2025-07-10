import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';
import { GetUploadUrlDto, TFilePurpose } from './video-insert.controller';
import { ConfigService } from '@nestjs/config';

dotenv.config();

type UploadInfo = {
  url: string;
  key: string;
};

@Injectable()
export class VideoInsertService {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly configService: ConfigService,
  ) {
    // 1. ConfigService에서 설정값 가져오기
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>(
      'AWS_BUCKET_IAM_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'AWS_BUCKET_IAM_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      // 하나라도 없으면 서버 내부 오류 예외를 발생시켜 서버 실행을 중단
      throw new InternalServerErrorException(
        'S3 클라이언트 설정에 필요한 환경 변수가 누락되었습니다.',
      );
    }
    // 2. 요청하신 형식으로 S3 클라이언트 설정 객체 생성
    const clientConfig: S3ClientConfig = {
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    };

    // 3. 생성된 설정 객체를 사용해 S3 클라이언트 초기화
    this.s3 = new S3Client(clientConfig);
  }

  async getUploadUrls(
    getUploadUrlDto: GetUploadUrlDto,
  ): Promise<Record<TFilePurpose, UploadInfo>> {
    const { purposes } = getUploadUrlDto;
    const response: Partial<Record<TFilePurpose, UploadInfo>> = {};

    const urlPromises = purposes.map(async (fileInfo) => {
      const { purpose, fileType } = fileInfo;

      let keyPrefix: string;
      switch (purpose) {
        case 'RESULT_VIDEO':
          keyPrefix = this.configService.get('RESULTS_PATH') || 'results_video';
          break;
        case 'SOURCE_VIDEO':
          keyPrefix = this.configService.get('SOURCE_PATH') || 'source_video';
          break;
        case 'THUMBNAIL':
          keyPrefix = this.configService.get('THUMBNAIL_PATH') || 'thumbnail';
          break;
        default:
          // 잘못된 purpose에 대한 예외 처리
          throw new Error(`Invalid purpose: ${purpose}`);
      }

      const key = `${keyPrefix}/${uuidv4()}`;
      const command = new PutObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET') || 'default-bucket',
        Key: key,
        ContentType: fileType,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });
      response[purpose] = { url, key };
    });

    await Promise.all(urlPromises);

    return response as Record<TFilePurpose, UploadInfo>;
  }

  async saveFinalVideoMeta(dto: SaveVideoMetaDto) {
    const video = this.videoRepository.create(dto);
    return this.videoRepository.save(video);
  }
}
