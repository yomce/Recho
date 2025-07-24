// src/likes/likes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { NumberIdLike } from './entities/number-id-like.entity';
import { Post } from 'src/community/posts/entities/post.entity';
import { StringIdLike } from './entities/string-id-like.entity';
import { Video } from 'src/videos/entities';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User } from 'src/auth/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NumberIdLike, StringIdLike, Post, Video, User]),
    NotificationsModule,
  ],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
