import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from '../entities/video.entity';
import { Repository } from 'typeorm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NotFoundException } from '@nestjs/common';

// Mock S3Client and getSignedUrl
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('mock-presigned-url')),
}));

describe('VideosService', () => {
  let service: VideosService;
  let videoRepository: Repository<Video>;

  beforeEach(async () => {
    jest.clearAllMocks(); // 모든 모의(mock) 호출 횟수 초기화
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useClass: Repository, // Use a mock repository
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));

    // Mock repository methods
    jest.spyOn(videoRepository, 'find').mockResolvedValue([]);
    jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getThumbnailsByUser', () => {
    it('should return an empty array if no videos are found', async () => {
      const userId = 1;
      const result = await service.getThumbnailsByUser(userId);
      expect(result).toEqual([]);
      expect(videoRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should return presigned URLs for thumbnails', async () => {
      const userId = 1;
      const mockVideos = [
        { video_id: 1, user_id: 1, thumbnail_key: 'thumb1.png' } as Video,
        { video_id: 2, user_id: 1, thumbnail_key: 'thumb2.png' } as Video,
      ];
      jest.spyOn(videoRepository, 'find').mockResolvedValue(mockVideos);

      const result = await service.getThumbnailsByUser(userId);
      expect(result).toEqual(['mock-presigned-url', 'mock-presigned-url']);
      expect(getSignedUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('getVideos', () => {
    it('should return videos sorted by likes', async () => {
      const mockVideos = [
        {
          video_id: 1,
          like_count: 10,
          video_key: 'vid1.mp4',
          thumbnail_key: 'thumb1.png',
        } as Video,
        {
          video_id: 2,
          like_count: 5,
          video_key: 'vid2.mp4',
          thumbnail_key: 'thumb2.png',
        } as Video,
      ];
      jest.spyOn(videoRepository, 'find').mockResolvedValue(mockVideos);

      const result = await service.getVideos('likes', 10, 1);
      expect(result).toHaveLength(2);
      expect(result[0].video_key).toBe('mock-presigned-url');
      expect(result[0].thumbnail_key).toBe('mock-presigned-url');
      expect(getSignedUrl).toHaveBeenCalledTimes(4); // 2 videos * 2 keys (video_key, thumbnail_key)
    });

    it('should return videos with default sorting if sortBy is not likes', async () => {
      const mockVideos = [
        {
          video_id: 1,
          like_count: 10,
          video_key: 'vid1.mp4',
          thumbnail_key: 'thumb1.png',
        } as Video,
      ];
      jest.spyOn(videoRepository, 'find').mockResolvedValue(mockVideos);

      const result = await service.getVideos('date', 10, 1);
      expect(result).toHaveLength(1);
      expect(videoRepository.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
      });
      expect(getSignedUrl).toHaveBeenCalledTimes(2); // 1 video * 2 keys
    });
  });

  describe('getSourceVideoUrl', () => {
    it('should return a presigned URL for the source video', async () => {
      const videoId = 1;
      const mockVideo = { video_id: 1, video_key: 'source-video.mp4' } as Video;
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(mockVideo);

      const result = await service.getSourceVideoUrl(videoId);
      expect(result).toBe('mock-presigned-url');
      expect(videoRepository.findOne).toHaveBeenCalledWith({
        where: { video_id: videoId },
      });
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if video is not found', async () => {
      const videoId = 999;
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getSourceVideoUrl(videoId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
