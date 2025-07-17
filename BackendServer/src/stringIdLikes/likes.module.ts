// src/likes/likes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { NumberIdLike } from './entities/numberIdLike.entity';
import { Post } from 'src/community/entities/post.entity';
import { StringIdLike } from './entities/stringIdLike.entity';
import { Video } from 'src/videos/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([NumberIdLike, StringIdLike, Post, Video]), // Like 엔티티를 이 모듈에서 사용할 수 있도록 등록,
  ],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
