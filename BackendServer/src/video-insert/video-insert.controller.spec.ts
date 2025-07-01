import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { VideoInsertController } from './video-insert.controller';
import { VideoInsertService } from './video-insert.service';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';

describe('VideoInsertController', () => {
  let app: INestApplication;
  let videoInsertService: VideoInsertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoInsertController],
      providers: [
        {
          provide: VideoInsertService,
          useValue: {
            getUploadUrls: jest.fn(),
            saveFinalVideoMeta: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    videoInsertService = module.get<VideoInsertService>(VideoInsertService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(videoInsertService).toBeDefined();
  });

  describe('POST /video-insert/upload-urls', () => {
    it('should return presigned URLs for multiple files', async () => {
      const mockResponse = [
        { key: 'video-key-1', url: 'mock-url-1' },
        { key: 'thumbnail-key-1', url: 'mock-url-2' },
      ];
      jest
        .spyOn(videoInsertService, 'getUploadUrls')
        .mockResolvedValue(mockResponse);

      const requestBody = {
        files: [{ fileType: 'video/mp4' }, { fileType: 'image/png' }],
      };

      const response = await request(app.getHttpServer())
        .post('/video-insert/upload-urls')
        .send(requestBody)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(videoInsertService.getUploadUrls).toHaveBeenCalledWith(
        requestBody.files,
      );
    });
  });

  describe('POST /video-insert/complete', () => {
    it('should save final video metadata', async () => {
      const mockVideo = { video_id: 1, video_key: 'final-video.mp4' } as any;
      jest
        .spyOn(videoInsertService, 'saveFinalVideoMeta')
        .mockResolvedValue(mockVideo);

      const requestBody: SaveVideoMetaDto = {
        user_id: 1,
        video_key: 'final-video.mp4',
        thumbnail_key: 'final-thumbnail.png',
        parent_video_id: 123,
        depth: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/video-insert/complete')
        .send(requestBody)
        .expect(201);

      expect(response.body).toEqual(mockVideo);
      expect(videoInsertService.saveFinalVideoMeta).toHaveBeenCalledWith(
        requestBody,
      );
    });
  });
});
