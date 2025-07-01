import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

describe('VideosController', () => {
  let app: INestApplication;
  let videosService: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: {
            getThumbnailsByUser: jest.fn(),
            getVideos: jest.fn(),
            getSourceVideoUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    videosService = module.get<VideosService>(VideosService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(videosService).toBeDefined();
  });

  describe('GET /videos/thumbnails', () => {
    it('should return an array of thumbnail URLs', async () => {
      const mockThumbnails = ['url1', 'url2'];
      jest
        .spyOn(videosService, 'getThumbnailsByUser')
        .mockResolvedValue(mockThumbnails);

      const userId = 1;
      const response = await request(app.getHttpServer())
        .get(`/videos/thumbnails?userId=${userId}`)
        .expect(200);

      expect(response.body).toEqual(mockThumbnails);
      expect(videosService.getThumbnailsByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('GET /videos', () => {
    it('should return an array of videos', async () => {
      const mockVideos = [{ video_id: 1, title: 'Test Video' }];
      jest
        .spyOn(videosService, 'getVideos')
        .mockResolvedValue(mockVideos as any);

      const response = await request(app.getHttpServer())
        .get('/videos?sortBy=likes&limit=5&page=1')
        .expect(200);

      expect(response.body).toEqual(mockVideos);
      expect(videosService.getVideos).toHaveBeenCalledWith('likes', 5, 1);
    });
  });

  describe('GET /videos/source', () => {
    it('should return a presigned URL for the source video', async () => {
      const mockSourceUrl = 'mock-source-url';
      jest
        .spyOn(videosService, 'getSourceVideoUrl')
        .mockResolvedValue(mockSourceUrl);

      const videoId = 123;
      const response = await request(app.getHttpServer())
        .get(`/videos/source?videoId=${videoId}`)
        .expect(200);

      expect(response.text).toEqual(mockSourceUrl);
      expect(videosService.getSourceVideoUrl).toHaveBeenCalledWith(videoId);
    });
  });
});
