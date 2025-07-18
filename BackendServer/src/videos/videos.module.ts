import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities';
import { UserModule } from 'src/auth/user/user.module';
import { LikesModule } from 'src/likes/likes.module';
import { CommentsModule } from 'src/comment/comments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    UserModule,
    LikesModule,
    CommentsModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
