// src/videos/videos.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { S3Client, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Video } from './entities';
import { UserService } from 'src/auth/user/user.service';

@Injectable()
export class VideosService {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
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
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const videos = await this.videoRepository.find({
      where: { user: user },
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
              Bucket: this.configService.get('AWS_S3_BUCKET'),
              Key: video.results_video_key,
            }),
            { expiresIn: 3600 },
          ),
          getSignedUrl(
            this.s3,
            new GetObjectCommand({
              Bucket: this.configService.get('AWS_S3_BUCKET'),
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
        Bucket: this.configService.get('AWS_S3_BUCKET'),
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
          Bucket: this.configService.get('AWS_S3_BUCKET'),
          Key: video.source_video_key,
        }),
        { expiresIn: 3600 },
      ),
      getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: this.configService.get('AWS_S3_BUCKET'),
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
      const video = await this.videoRepository.findOne({
        where: { id: currentVideoId },
        relations: ['parent'], // [수정] 부모 관계를 명시적으로 로드
        select: [
          'id',
          'parent_video_id',
          'depth',
          'startTime',
          'endTime',
          'timelinePosition',
          'source_video_key',
          'results_video_key', // globalStart/EndTime 계산을 위해 추가
          'thumbnail_key', // 썸네일 표시를 위해 추가
        ],
      });

      if (!video) {
        break;
      }
      // 소스 비디오의 URL을 생성하여 video_url에 할당
      video.video_url = await this.getSourceVideoUrl(video.source_video_key);

      lineage.push(video);
      // [수정] 직접 ID를 사용하는 대신, 로드된 관계를 통해 다음 ID를 찾음
      currentVideoId = video.parent ? video.parent.id : null;
    }

    return lineage.reverse();
  }
}
