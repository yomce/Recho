import { Test, TestingModule } from '@nestjs/testing';
import { VideoInsertService } from './video-insert.service';

describe('VideoInsertService', () => {
  let service: VideoInsertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoInsertService],
    }).compile();

    service = module.get<VideoInsertService>(VideoInsertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
