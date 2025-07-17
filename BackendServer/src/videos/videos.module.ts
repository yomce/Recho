import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities';
import { UserModule } from 'src/auth/user/user.module';
import { LikesModule } from 'src/stringIdLikes/likes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Video]), UserModule, LikesModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
