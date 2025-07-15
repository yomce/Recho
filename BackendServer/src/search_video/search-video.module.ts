import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '../videos/entities/video.entity';
import { SearchVideoPreview } from './entities/search-video.entity';
import { SearchVideoController } from './search-video.controller';
import { SearchVideoService } from './search-video.service';
import { UserModule } from 'src/auth/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Video, SearchVideoPreview]),
  UserModule,
],
  providers: [SearchVideoService],
  controllers: [SearchVideoController],
})
export class searchVideoModule {}