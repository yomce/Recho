import { Test, TestingModule } from '@nestjs/testing';
import { VideoInsertController } from './video-insert.controller';
import { VideoInsertService } from './video-insert.service';

describe('VideoInsertController', () => {
  let controller: VideoInsertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoInsertController],
      providers: [VideoInsertService],
    }).compile();

    controller = module.get<VideoInsertController>(VideoInsertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
