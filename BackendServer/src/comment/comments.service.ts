// src/comments/comments.service.ts

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'src/community/entities/post.entity';
import { Video } from 'src/videos/entities';
import { NumberIdComment } from './entities/number-id-comment.entity';
import { StringIdComment } from './entities/string-id-comment.entity';
import { CreateCommentDto } from './dto/create-comments.dto';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(NumberIdComment)
    private readonly numberCommentsRepository: Repository<NumberIdComment>,
    @InjectRepository(StringIdComment)
    private readonly stringCommentsRepository: Repository<StringIdComment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { contentType, postId, content } = createCommentDto;

    if (typeof postId === 'number') {
      return this.createNumberIdComment(userId, {
        contentType,
        postId,
        content,
      });
    }

    if (typeof postId === 'string') {
      return this.createStringIdComment(userId, {
        contentType,
        postId,
        content,
      });
    }
    throw new BadRequestException('postId must be a number or a string.');
  }

  private async createNumberIdComment(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: number; content: string },
  ) {
    const newComment = this.numberCommentsRepository.create({ ...dto, userId });
    await this.numberCommentsRepository.save(newComment);
    await this.updateContentCommentsCount(dto.contentType, dto.postId, 1);
    return newComment;
  }

  private async createStringIdComment(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: string; content: string },
  ) {
    const newComment = this.stringCommentsRepository.create({ ...dto, userId });
    await this.stringCommentsRepository.save(newComment);
    await this.updateContentCommentsCount(dto.contentType, dto.postId, 1);
    return newComment;
  }

  /**
   * [수정됨] Get all comments for a specific piece of content.
   */
  async getComments(contentType: CONTENT_TYPE, postId: number | string) {
    const commonOptions = {
      relations: ['user'],
      order: { createdAt: 'ASC' as const },
    };

    if (typeof postId === 'number') {
      // ✅ postId가 number임을 타입스크립트가 아는 상태에서 옵션과 함께 호출
      return this.numberCommentsRepository.find({
        ...commonOptions,
        where: { contentType, postId }, // postId는 number 타입
      });
    }
    if (typeof postId === 'string') {
      // ✅ postId가 string임을 타입스크립트가 아는 상태에서 옵션과 함께 호출
      return this.stringCommentsRepository.find({
        ...commonOptions,
        where: { contentType, postId }, // postId는 string 타입
      });
    }
    throw new BadRequestException('postId must be a number or a string.');
  }

  /**
   * [수정됨] Delete a user's own comment.
   */
  async deleteComment(userId: string, commentId: number | string) {
    if (typeof commentId === 'number') {
      // ✅ NumberIdComment 삭제 로직
      const comment = await this.numberCommentsRepository.findOne({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found.');
      }
      if (comment.userId !== userId) {
        throw new ForbiddenException('You can only delete your own comments.');
      }

      await this.numberCommentsRepository.remove(comment);
      await this.updateContentCommentsCount(
        comment.contentType,
        comment.postId,
        -1,
      );
    } else {
      // ✅ StringIdComment 삭제 로직
      const comment = await this.stringCommentsRepository.findOne({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found.');
      }
      if (comment.userId !== userId) {
        throw new ForbiddenException('You can only delete your own comments.');
      }

      await this.stringCommentsRepository.remove(comment);
      await this.updateContentCommentsCount(
        comment.contentType,
        comment.postId,
        -1,
      );
    }

    return { message: 'Comment deleted successfully.' };
  }

  /**
   * [Private] Updates the 'commentCount' on the parent content entity.
   */
  private async updateContentCommentsCount(
    contentType: CONTENT_TYPE,
    postId: number | string,
    changeValue: 1 | -1,
  ): Promise<void> {
    let repository: Repository<any>;
    let targetId: { [key: string]: number | string };

    switch (contentType) {
      case CONTENT_TYPE.COMMUNITY:
        if (typeof postId !== 'number') return;
        repository = this.postsRepository;
        targetId = { postId: postId };
        break;

      case CONTENT_TYPE.VINYL:
        if (typeof postId !== 'string') return;
        repository = this.videoRepository;
        targetId = { id: postId };
        break;

      default:
        console.warn(
          `Unsupported content type (${contentType}) for comment count update.`,
        );
        return;
    }

    try {
      await repository.increment(targetId, 'commentCount', changeValue);
    } catch (error) {
      console.error(
        `Failed to update comment count for ${contentType}:${postId}`,
        error,
      );
    }
  }
}
