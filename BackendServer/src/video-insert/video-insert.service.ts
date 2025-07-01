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

  async getUploadUrls(
    files: { fileType: string }[],
  ): Promise<{ key: string; url: string }[]> {
    const promises = files.map(async (file) => {
      const key = `videos/${uuidv4()}`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: file.fileType,
      });
      const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });
      return { key, url };
    });
    return Promise.all(promises);
  }

  async saveFinalVideoMeta(dto: SaveVideoMetaDto): Promise<Video> {
    const video = this.videoRepository.create(dto);
    return this.videoRepository.save(video);
  }
}
