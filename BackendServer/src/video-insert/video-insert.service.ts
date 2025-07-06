import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';

dotenv.config();

@Injectable()
export class VideoInsertService {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async getUploadUrls(fileType: string): Promise<{
    videoUrl: string;
    thumbnailUrl: string;
    videoKey: string;
    thumbnailKey: string;
  }> {
    const videoKey = `${process.env.RESULTS_PATH}/${uuidv4()}`;
    const thumbnailKey = `${process.env.THUMBNAIL_PATH}/${uuidv4()}`;

    const videoCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: videoKey,
      ContentType: fileType,
    });

    const thumbnailCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: thumbnailKey,
      ContentType: 'image/png', // Or appropriate thumbnail type
    });

    const [videoUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(this.s3, videoCommand, { expiresIn: 60 * 5 }),
      getSignedUrl(this.s3, thumbnailCommand, { expiresIn: 60 * 5 }),
    ]);

    return { videoUrl, thumbnailUrl, videoKey, thumbnailKey };
  }

  async saveFinalVideoMeta(dto: SaveVideoMetaDto) {
    const video = this.videoRepository.create(dto);
    return this.videoRepository.save(video);
  }
}
