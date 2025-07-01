import { Test, TestingModule } from '@nestjs/testing';
import { VideoInsertService } from './video-insert.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from '../entities/video.entity';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock S3Client and getSignedUrl
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('mock-presigned-url')),
}));

describe('VideoInsertService', () => {
  let service: VideoInsertService;
  let videoRepository: Repository<Video>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoInsertService,
        {
          provide: getRepositoryToken(Video),
          useClass: Repository, // Use a mock repository
        },
      ],
    }).compile();

    service = module.get<VideoInsertService>(VideoInsertService);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));

    // Mock repository methods
    jest.spyOn(videoRepository, 'create').mockReturnValue({} as Video);
    jest.spyOn(videoRepository, 'save').mockResolvedValue({} as Video);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUploadUrls', () => {
    it('should return an array of presigned URLs and keys', async () => {
      const files = [{ fileType: 'video/mp4' }, { fileType: 'image/png' }];
      const result = await service.getUploadUrls(files);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('url');
      expect(result[0].url).toBe('mock-presigned-url');
      expect(PutObjectCommand).toHaveBeenCalledTimes(2);
      expect(getSignedUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveFinalVideoMeta', () => {
    it('should save video metadata to the database', async () => {
      const dto = {
        user_id: 1,
        video_key: 'videos/test-video.mp4',
        thumbnail_key: 'videos/test-thumbnail.png',
        parent_video_id: undefined,
        depth: undefined,
      };

      const result = await service.saveFinalVideoMeta(dto);

      expect(videoRepository.create).toHaveBeenCalledWith(dto);
      expect(videoRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
