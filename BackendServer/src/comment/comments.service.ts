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

interface RankedCommentRaw {
  sub_comment_id: number | string;
  rank: string; // RANK() 결과는 문자열일 수 있으므로 string으로 처리 후 파싱
}

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
  /**
   * [개선됨] 여러 콘텐츠(게시물, 비디오 등)에 대한 최신 댓글들을 일괄 조회합니다.
   * RANK() 윈도우 함수를 사용하여 DB 레벨에서 효율적으로 그룹별 N개를 가져옵니다.
   * @param contentType 댓글을 달 대상의 타입
   * @param ids 콘텐츠 ID 배열 (숫자 또는 문자)
   * @param limit 각 콘텐츠당 가져올 최신 댓글의 수 (기본값: 2)
   * @returns 콘텐츠 ID를 키로, 댓글 객체 배열을 값으로 가지는 Map
   */
  async findRecentCommentsForContents(
    contentType: CONTENT_TYPE,
    ids: (number | string)[],
    limit = 2,
  ): Promise<Map<number | string, (NumberIdComment | StringIdComment)[]>> {
    if (ids.length === 0) {
      return new Map();
    }

    // 1. ID를 타입에 따라 분리합니다.
    const numberIds = ids.filter((id): id is number => typeof id === 'number');
    const stringIds = ids.filter((id): id is string => typeof id === 'string');

    // 2. 각 타입별로 댓글을 병렬로 조회합니다.
    const [numberComments, stringComments] = await Promise.all([
      numberIds.length > 0
        ? this.findRankedComments(
            this.numberCommentsRepository,
            numberIds,
            contentType,
            limit,
          )
        : Promise.resolve([]),
      stringIds.length > 0
        ? this.findRankedComments(
            this.stringCommentsRepository,
            stringIds,
            contentType,
            limit,
          )
        : Promise.resolve([]),
    ]);

    // 3. 조회된 모든 댓글을 하나의 배열로 합칩니다.
    const allComments = [...numberComments, ...stringComments];

    // 4. 콘텐츠 ID를 기준으로 댓글을 그룹핑하여 Map을 생성합니다.
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

  /**
   * [Private] RANK()를 사용하여 그룹별 최신 댓글을 가져오는 헬퍼 메서드
   */
  private async findRankedComments<T extends NumberIdComment | StringIdComment>(
    repository: Repository<T>,
    postIds: (number | string)[],
    contentType: CONTENT_TYPE,
    limit: number,
  ): Promise<T[]> {
    const subQuery = repository
      .createQueryBuilder('sub_comment')
      .select('sub_comment.id')
      .addSelect(
        `RANK() OVER (PARTITION BY sub_comment."postId" ORDER BY sub_comment."createdAt" DESC) as "rank"`,
      )
      .where('sub_comment."postId" IN (:...postIds)', { postIds })
      .andWhere('sub_comment."contentType" = :contentType', { contentType });

    const rawResults: RankedCommentRaw[] = await subQuery.getRawMany();

    const rankedCommentIds = rawResults
      .filter((c) => parseInt(c.rank, 10) <= limit)
      .map((c) => c.sub_comment_id);

    if (rankedCommentIds.length === 0) {
      return [];
    }

    return repository.find({
      // ✅ ESLint 규칙을 비활성화하여 as any 사용을 허용
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: {
        id: In(rankedCommentIds),
      } as any,
      relations: ['user'],
      // ✅ ESLint 규칙을 비활성화하여 as any 사용을 허용
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      order: {
        createdAt: 'ASC',
      } as any,
    });
  }
}
