import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { S3Client, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Video } from './entities';
import { UserService } from 'src/auth/user/user.service';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';
import { LikesService } from 'src/likes/likes.service';
import { User } from 'src/auth/user/user.entity';
import { CommentsService } from 'src/comment/comments.service';
import { VideoResponseDto } from './dto/video.response.dto';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { ImageService } from 'src/image/image.service';

@Injectable()
export class VideosService {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly imageService: ImageService,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>(
      'AWS_BUCKET_IAM_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'AWS_BUCKET_IAM_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'S3 클라이언트 설정에 필요한 환경 변수가 누락되었습니다.',
      );
    }
    const clientConfig: S3ClientConfig = {
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    };
    this.s3 = new S3Client(clientConfig);
  }

  async getThumbnailsByUser(id: string): Promise<string[]> {
    const user = await this.userService.internalFindById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const videos = await this.videoRepository.find({
      where: { user: { id: id }, isActivate: true },
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

  async getVideosByUser(id: string): Promise<Video[]> {
    const user = await this.userService.internalFindById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const videos = await this.videoRepository.find({
      where: { user: { id: id }, isActivate: true },
      order: { created_at: 'DESC' },
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
        video.video_url = videoUrl;
        video.thumbnail_url = thumbnailUrl;

        return video;
      }),
    );

    return signedVideos;
  }

  async getVideos(
    page: number,
    limit: number,
    sortBy: 'likes' | 'createdAt',
    user: User | undefined,
  ): Promise<any[]> {
    const videos = await this.videoRepository.find({
      relations: ['user'],
      where: { isActivate: true },
      order: { [sortBy === 'likes' ? 'like_count' : 'created_at']: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (videos.length === 0) {
      return [];
    }

    const videoIds = videos.map((video) => video.id);

    const [likedVideoIds, commentsMap] = await Promise.all([
      user
        ? this.likesService.getUserLikedStatusesForContents(
            user.id,
            CONTENT_TYPE.VINYL,
            videoIds,
          )
        : new Set<string>(),
      this.commentsService.findRecentCommentsForContents(
        CONTENT_TYPE.VINYL,
        videoIds,
      ),
    ]);

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
        video.video_url = videoUrl;
        video.thumbnail_url = thumbnailUrl;
        return video;
      }),
    );

    const responseVideo = await Promise.all(
      signedVideos.map(async (video) => {
        const commentsForVideo = commentsMap.get(video.id) || [];

        const tmpUser = UserResponseDto.from(video.user);
        const tmpVideo = VideoResponseDto.from(video, tmpUser);

        if (video.user && video.user.profileUrl) {
          const signedUrl = await this.imageService.getDownloadUrl(
            video.user.profileUrl,
          );
          tmpVideo.user.profileImageUrl = signedUrl;
        }

        return {
          ...tmpVideo,
          userLiked: likedVideoIds.has(video.id),
          comments: commentsForVideo,
        };
      }),
    );

    return responseVideo;
  }

  async getVideoDetails(id: string, user: User | undefined): Promise<any> {
    const video = await this.videoRepository.findOne({
      where: { id, isActivate: true },
      relations: ['user', 'parent'],
    });

    if (!video) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    const [userLiked, comments, videoUrl, thumbnailUrl] = await Promise.all([
      user
        ? this.likesService.hasUserLiked(user.id, CONTENT_TYPE.VINYL, id)
        : false,
      this.commentsService.getComments(CONTENT_TYPE.VINYL, id),
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

    video.video_url = videoUrl;
    video.thumbnail_url = thumbnailUrl;
    const responseUser = UserResponseDto.from(video.user);
    const responseVideo = VideoResponseDto.from(video, responseUser);

    if (video.user && video.user.profileUrl) {
      const signedUrl = await this.imageService.getDownloadUrl(
        video.user.profileUrl,
      );
      responseVideo.user.profileImageUrl = signedUrl;
    }

    return {
      ...responseVideo,
      userLiked,
      comments,
    };
  }

  async findVideoLineage(id: string): Promise<Video[]> {
    const lineage: Video[] = [];
    let currentVideoId: string | null = id;

    while (currentVideoId) {
      const video = await this.videoRepository.findOne({
        where: { id: currentVideoId },
        relations: ['parent'],
        select: [
          'id',
          'parent_video_id',
          'depth',
          'startTime',
          'endTime',
          'timelinePosition',
          'source_video_key',
          'results_video_key',
          'thumbnail_key',
        ],
      });

      if (!video) {
        break;
      }
      video.video_url = await this.getSourceVideoUrl(video.source_video_key);

      lineage.push(video);
      currentVideoId = video.parent ? video.parent.id : null;
    }

    return lineage.reverse();
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

  async deactivateVideo(id: string, user: User) {
    const video = await this.videoRepository.findOne({
      where: { id, isActivate: true },
      relations: ['user'],
    });

    if (!video) {
      throw new NotFoundException('삭제하려는 바이닐을 찾을 수 없습니다.');
    }
    if (video.user.id !== user.id) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }

    video.isActivate = false;
    await this.videoRepository.save(video);
  }
}
