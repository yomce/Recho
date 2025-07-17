// src/comments/comments.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Post } from 'src/community/entities/post.entity';
import { Video } from 'src/videos/entities';
import { AuthModule } from 'src/auth/auth.module'; // Assuming you have an AuthModule
import { NumberIdComment } from './entities/number-id-comment.entity';
import { StringIdComment } from './entities/string-id-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NumberIdComment,
      StringIdComment,
      Post, // For updating commentCount
      Video, // For updating commentCount
    ]),
    AuthModule, // To get user info from JWT
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
