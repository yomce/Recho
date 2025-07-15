import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '../videos/entities/video.entity';
import { SearchVideoPreview } from './entities/search-video.entity';
import { SearchVideoController } from './search-video.controller';
import { SearchVideoService } from './search-video.service';

@Module({
  imports: [TypeOrmModule.forFeature([Video, SearchVideoPreview])],
  providers: [SearchVideoService],
  controllers: [SearchVideoController],
})
export class searchVideoModule {}