// src/videos/videos.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideosService {
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
            Bucket: this.configService.get('AWS_S3_BUCKET'),
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
