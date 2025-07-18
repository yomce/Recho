// src/comments/comments.service.ts

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    // 1. 댓글 엔티티를 생성하고 DB에 저장합니다.
    // .save() 메소드는 저장된 엔티티(DB에 의해 생성된 ID 포함)를 반환합니다.
    const newCommentEntity = this.numberCommentsRepository.create({ ...dto, userId });
    const savedComment = await this.numberCommentsRepository.save(newCommentEntity);

    // 2. 기존 기능(댓글 수 업데이트, 알림 전송)을 그대로 수행합니다.
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
    }
    
    // 3. user 관계가 포함된 완전한 댓글 객체를 조회하여 반환합니다.
    const fullComment = await this.numberCommentsRepository.findOne({
        where: { commentId: savedComment.commentId },
        relations: ['user'],
    });

    if (!fullComment) {
        throw new NotFoundException('생성된 댓글을 가져오는 데 실패했습니다.');
    }

    return fullComment;
  }

  private async createStringIdComment(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: string; content: string },
  ) {
    // 1. 댓글 엔티티를 생성하고 DB에 저장합니다.
    const newCommentEntity = this.stringCommentsRepository.create({ ...dto, userId });
    const savedComment = await this.stringCommentsRepository.save(newCommentEntity);

    // 2. 기존 기능(댓글 수 업데이트, 알림 전송)을 그대로 수행합니다.
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
    
    // 3. user 관계가 포함된 완전한 댓글 객체를 조회하여 반환합니다.
    const fullComment = await this.stringCommentsRepository.findOne({
        where: { commentId: savedComment.commentId },
        relations: ['user'],
    });

    if (!fullComment) {
        throw new NotFoundException('생성된 댓글을 가져오는 데 실패했습니다.');
    }

    return fullComment;
  }

  async getComments(contentType: CONTENT_TYPE, postId: number | string) {
    const commonOptions = {
      relations: ['user'],
      order: { createdAt: 'ASC' as const },
    };

    if (typeof postId === 'number') {
      return this.numberCommentsRepository.find({
        ...commonOptions,
        where: { contentType, postId },
      });
    }
    if (typeof postId === 'string') {
      return this.stringCommentsRepository.find({
        ...commonOptions,
        where: { contentType, postId },
      });
    }
    throw new BadRequestException('postId must be a number or a string.');
  }

  async deleteComment(userId: string, commentId: number | string) {
    if (typeof commentId === 'number') {
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

  async findRecentCommentsForContents(
    contentType: CONTENT_TYPE,
    ids: (number | string)[],
    limit = 2,
  ): Promise<Map<number | string, (NumberIdComment | StringIdComment)[]>> {
    if (ids.length === 0) {
      return new Map();
    }

    const numberIds = ids.filter((id): id is number => typeof id === 'number');
    const stringIds = ids.filter((id): id is string => typeof id === 'string');

    const [numberComments, stringComments] = await Promise.all([
      this.findRecentNumberComments(numberIds, contentType, limit),
      this.findRecentStringComments(stringIds, contentType, limit),
    ]);

    const allComments = [...numberComments, ...stringComments];

    const commentsMap = new Map<
      number | string,
      (NumberIdComment | StringIdComment)[]
    >();
    for (const comment of allComments) {
      const existing = commentsMap.get(comment.postId) || [];
      existing.push(comment);
      commentsMap.set(comment.postId, existing);
    }

    return commentsMap;
  }

  private async findRecentNumberComments(
    postIds: number[],
    contentType: CONTENT_TYPE,
    limit: number,
  ): Promise<NumberIdComment[]> {
    if (postIds.length === 0) return [];

    const subQuery = this.numberCommentsRepository
      .createQueryBuilder('comment')
      .select('comment.commentId', 'commentId')
      .addSelect(
        `RANK() OVER (PARTITION BY comment.postId ORDER BY comment.createdAt DESC) as "rank"`,
      )
      .where('comment.postId IN (:...postIds)', { postIds })
      .andWhere('comment.contentType = :contentType', { contentType });

    const rawResults: { commentId: number; rank: string }[] =
      await subQuery.getRawMany();

    const commentIds = rawResults
      .filter((c) => parseInt(c.rank, 10) <= limit)
      .map((c) => c.commentId);

    if (commentIds.length === 0) return [];

    return this.numberCommentsRepository.find({
      where: { commentId: In(commentIds) },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  private async findRecentStringComments(
    postIds: string[],
    contentType: CONTENT_TYPE,
    limit: number,
  ): Promise<StringIdComment[]> {
    if (postIds.length === 0) return [];

    const subQuery = this.stringCommentsRepository
      .createQueryBuilder('comment')
      .select('comment.commentId')
      .addSelect(
        `RANK() OVER (PARTITION BY comment.postId ORDER BY comment.createdAt DESC) as "rank"`,
      )
      .where('comment.postId IN (:...postIds)', { postIds })
      .andWhere('comment.contentType = :contentType', { contentType });

    const rawResults: { comment_commentId: string; rank: string }[] =
      await subQuery.getRawMany();

    const commentIds = rawResults
      .filter((c) => parseInt(c.rank, 10) <= limit)
      .map((c) => c.comment_commentId);

    if (commentIds.length === 0) return [];

    return this.stringCommentsRepository.find({
      where: { commentId: In(commentIds) },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
