// src/comments/comments.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Post } from 'src/community/posts/entities/post.entity';
import { Video } from 'src/videos/entities';
import { AuthModule } from 'src/auth/auth.module'; // Assuming you have an AuthModule
import { NumberIdComment } from './entities/number-id-comment.entity';
import { StringIdComment } from './entities/string-id-comment.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User } from 'src/auth/user/user.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NumberIdComment,
      StringIdComment,
      Post, // For updating commentCount
      Video, // For updating commentCount
      User,
    ]),
    AuthModule, // To get user info from JWT
    NotificationsModule,
    ImageModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
