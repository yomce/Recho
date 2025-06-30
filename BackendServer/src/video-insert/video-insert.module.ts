import { Module } from '@nestjs/common';
import { VideoInsertService } from './video-insert.service';
import { VideoInsertController } from './video-insert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '../entities/video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  providers: [VideoInsertService],
  controllers: [VideoInsertController],
})
export class VideoInsertModule {}
