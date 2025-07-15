import { Injectable, InternalServerErrorException, } from '@nestjs/common';
import { S3Client, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../videos/entities/video.entity';
import { SearchVideoPreview } from './entities/search-video.entity';
import { VideoPreviewDto } from './dto/search-video.dto';
import { CreateVideoPreviewDto } from './dto/create-video-preview.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/auth/user/user.service';

@Injectable()
export class SearchVideoService {
  private readonly s3: S3Client;

  constructor (
    @InjectRepository(Video)
    private readonly searchVideoRepository: Repository<Video>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,

    @InjectRepository(SearchVideoPreview)
    private readonly videoPreviewRepository: Repository<SearchVideoPreview>,
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

  async getMyVideos(userId: string): Promise<VideoPreviewDto[]> {
    const videos = await this.searchVideoRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
    });

    const bucket = this.configService.get('AWS_S3_BUCKET');

    return Promise.all(
      videos.map(async (video) => {
        const signedThumbnailUrl = await getSignedUrl(
          this.s3,
          new GetObjectCommand({
            Bucket: bucket,
            Key: video.thumbnail_key,
          }),
          { expiresIn: 3600 },
        );

        return {
          id: video.id,
          videoUrl: video.results_video_key.replace(/^results_video\//, ''),
          thumbnailUrl: signedThumbnailUrl,
        };
      }),
    );
  }

  async createVideoPreview(dto: CreateVideoPreviewDto): Promise<SearchVideoPreview> {
    const entity = this.videoPreviewRepository.create({
      refIn: dto.refIn,
      refPostId: dto.refPostId || null,
      video_id: dto.videoId,
    });

    return this.videoPreviewRepository.save(entity);
  }

  async findVideoByRef(refIn: string, refPostId: number): Promise<any | null> {
    const preview = await this.videoPreviewRepository.findOne({
      where: { refIn, refPostId },
      relations: ['video'],
    });

    if (!preview || !preview.video) return null;

    return {
      id: preview.id,
      refIn: preview.refIn,
      refPostId: preview.refPostId,
      video_id: preview.video.id,
      videoUrl: preview.video.results_video_key.replace(/^results_video\//, ''),
      thumbnailUrl: preview.video.thumbnail_key,
      createdAt: preview.createdAt,
    };
  }
}