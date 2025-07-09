// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../entities/post.entity'; // 엔티티 임포트

@Module({
  imports: [TypeOrmModule.forFeature([Post])], // Post Repository를 주입하기 위해 추가
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}