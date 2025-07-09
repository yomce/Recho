// src/videos/videos.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';

@Injectable()
export class VideosService {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async getThumbnailsByUser(id: string): Promise<string[]> {
    const videos = await this.videoRepository.find({
      where: { user_id: id },
      select: ['thumbnail_key'],
    });

    return Promise.all(
      videos.map((video) =>
        getSignedUrl(
          this.s3,
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: video.thumbnail_key,
          }),
          { expiresIn: 3600 },
        ),
      ),
    );
  }

  async getVideos(
    page: number,
    limit: number,
    sortBy: 'likes' | 'createdAt',
  ): Promise<any[]> {
    const videos = await this.videoRepository.find({
      order: { [sortBy === 'likes' ? 'like_count' : 'created_at']: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const signedVideos = await Promise.all(
      videos.map(async (video) => {
        const [videoUrl, thumbnailUrl] = await Promise.all([
          getSignedUrl(
            this.s3,
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: video.results_video_key,
            }),
            { expiresIn: 3600 },
          ),
          getSignedUrl(
            this.s3,
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: video.thumbnail_key,
            }),
            { expiresIn: 3600 },
          ),
        ]);
        return { ...video, video_url: videoUrl, thumbnail_url: thumbnailUrl };
      }),
    );

    return signedVideos;
  }

  async getSourceVideoUrl(videoKey: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: videoKey,
      }),
      { expiresIn: 3600 },
    );
  }

  async getVideoDetails(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id },
      relations: ['user', 'parent'],
    });
    if (!video) {
      throw new Error('Video not found');
    }

    const [videoUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: video.source_video_key,
        }),
        { expiresIn: 3600 },
      ),
      getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: video.thumbnail_key,
        }),
        { expiresIn: 3600 },
      ),
    ]);
    video.video_url = videoUrl;
    video.thumbnail_url = thumbnailUrl;

    return video;
  }

  async findVideoLineage(id: string): Promise<Video[]> {
    const lineage: Video[] = [];
    let currentVideoId: string | null = id;

    while (currentVideoId) {
      const videoDetails = await this.getVideoDetails(currentVideoId);
      if (!videoDetails) {
        break;
      }
      lineage.push(videoDetails);
      currentVideoId = videoDetails.parent_video_id || null;
    }

    return lineage.reverse();
  }
}
