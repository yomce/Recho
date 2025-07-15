// src/likes/likes.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { Like } from './entities/like.entity';
import { PostsModule } from 'src/community/posts/posts.module';
import { Post } from 'src/community/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Post]), // Like 엔티티를 이 모듈에서 사용할 수 있도록 등록
    forwardRef(() => PostsModule),
  ],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
