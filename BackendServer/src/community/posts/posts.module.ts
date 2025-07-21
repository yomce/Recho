// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity'; // 엔티티 임포트
import { NumberIdLike } from 'src/likes/entities/number-id-like.entity';
import { LikesModule } from 'src/likes/likes.module';
import { CommentsModule } from 'src/comment/comments.module';
import { NumberIdComment } from 'src/comment/entities/number-id-comment.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, NumberIdLike, NumberIdComment]),
    LikesModule,
    CommentsModule,
    ImageModule,
  ], // Post Repository를 주입하기 위해 추가
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
