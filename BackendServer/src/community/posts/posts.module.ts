// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../entities/post.entity'; // 엔티티 임포트
import { Like } from 'src/likes/entities/like.entity';
import { LikesModule } from 'src/likes/likes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Like]), LikesModule], // Post Repository를 주입하기 위해 추가
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
