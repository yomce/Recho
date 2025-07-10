import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity'; // ⭐️ Post 엔티티 임포트

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])], // ⭐️ Post Repository 주입
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}