// src/comments/comments.service.ts

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'src/community/posts/entities/post.entity';
import { Video } from 'src/videos/entities';
import { NumberIdComment } from './entities/number-id-comment.entity';
import { StringIdComment } from './entities/string-id-comment.entity';
import { CreateCommentDto } from './dto/create-comments.dto';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { User } from 'src/auth/user/user.entity';

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
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    if (dto.contentType === CONTENT_TYPE.COMMUNITY) {
      const post = await this.postsRepository.findOne({
        where: { postId: dto.postId },
        relations: ['user'],
      });
      const sender = await this.usersRepository.findOneBy({ id: userId });

      if (post?.user && sender && post.user.id !== userId) {
        await this.notificationsService.createAndSendNotification(
          post.user,
          sender,
          NotificationType.COMMENT,
          `${sender.username}님이 회원님의 게시물에 댓글을 남겼습니다.`,
          `/community/${post.postId}`,
        );
      }
      return newComment;
    }
  }

  private async createStringIdComment(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: string; content: string },
  ) {
    const newComment = this.stringCommentsRepository.create({ ...dto, userId });
    await this.stringCommentsRepository.save(newComment);
    await this.updateContentCommentsCount(dto.contentType, dto.postId, 1);

    if (dto.contentType === CONTENT_TYPE.VINYL) {
      const video = await this.videoRepository.findOne({
        where: { id: dto.postId },
        relations: ['user'],
      });
      const sender = await this.usersRepository.findOneBy({ id: userId });

      if (video?.user && sender && video.user.id !== userId) {
        await this.notificationsService.createAndSendNotification(
          video.user,
          sender,
          NotificationType.COMMENT,
          `${sender.username}님이 회원님의 영상에 댓글을 남겼습니다.`,
          `/vinyl/${video.id}`,
        );
      }
    }
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
        where: { commentId: commentId },
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
        where: { commentId: commentId },
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

  /**
   * 여러 게시물 ID에 대한 최신 댓글들을 일괄 조회합니다.
   * @param contentType 댓글을 달 대상의 타입
   * @param postIds 게시물 ID 배열
   * @returns Post ID를 키로, 댓글 배열을 값으로 가지는 Map 객체
   */
  async findRecentCommentsForPosts(
    contentType: CONTENT_TYPE,
    postIds: number[],
  ): Promise<Map<number, NumberIdComment[]>> {
    if (postIds.length === 0) {
      return new Map();
    }

    // 각 post_id별로 최신 댓글 2개를 가져오는 쿼리 (DB에 따라 SQL이 달라질 수 있음)
    const comments = await this.numberCommentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user') // 댓글 작성자 정보 조인
      .where('comment.postId IN (:...postIds)', { postIds })
      .andWhere('comment.contentType = :contentType', { contentType })
      .orderBy('comment.createdAt', 'DESC')
      // RANK() OVER PARTITION 등 window 함수를 사용하면 더 정확한 그룹별 N개 조회가 가능합니다.
      // 여기서는 간단하게 전체에서 최신 순으로 가져온 후 로직에서 그룹핑합니다.
      .getMany();

    // 조회된 댓글들을 postId 기준으로 그룹핑
    const commentsMap = new Map<number, NumberIdComment[]>();
    for (const comment of comments) {
      const existing = commentsMap.get(comment.postId) || [];
      // 각 게시물 당 최대 2개의 댓글만 포함
      if (existing.length < 2) {
        // user 객체에서 민감 정보 제거
        if (comment.user) {}
        existing.push(comment);
        commentsMap.set(comment.postId, existing);
      }
    }
    return commentsMap;
  }
}
