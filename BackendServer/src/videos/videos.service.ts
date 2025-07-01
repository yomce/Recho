// src/videos/videos.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from '../entities/video.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async getThumbnailsByUser(userId: number): Promise<string[]> {
    const videos = await this.videoRepository.find({
      where: { user_id: userId },
    });
    if (!videos.length) {
      return [];
    }

    const thumbnailUrls = await Promise.all(
      videos.map((video) => this.getPresignedUrl(video.thumbnail_key)),
    );
    return thumbnailUrls;
  }

  async getVideos(
    sortBy: string,
    limit: number,
    page: number,
  ): Promise<Video[]> {
    const options: FindManyOptions<Video> = {
      take: limit,
      skip: (page - 1) * limit,
    };

    if (sortBy === 'likes') {
      options.order = { like_count: 'DESC' };
    }

    const videos = await this.videoRepository.find(options);

    // 각 비디오의 video_key와 thumbnail_key를 Presigned URL로 변환
    for (const video of videos) {
      video.video_key = await this.getPresignedUrl(video.video_key);
      video.thumbnail_key = await this.getPresignedUrl(video.thumbnail_key);
    }

    return videos;
  }

  async getSourceVideoUrl(videoId: number): Promise<string> {
    const video = await this.videoRepository.findOne({
      where: { video_id: videoId },
    });
    if (!video) {
      throw new NotFoundException('비디오를 찾을 수 없습니다.');
    }
    return this.getPresignedUrl(video.video_key);
  }

  private async getPresignedUrl(key: string): Promise<string> {
    if (!key) return '';
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // 5분 동안 유효
  }
}
