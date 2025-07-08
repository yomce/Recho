import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,

    private readonly configService: ConfigService,
  ) {}

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
        Bucket: process.env.AWS_S3_BUCKET || 'default-bucket',
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
