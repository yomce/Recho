// src/likes/likes.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from 'src/community/posts/entities/post.entity';
import { NumberIdLike } from './entities/number-id-like.entity';
import { StringIdLike } from './entities/string-id-like.entity';
import { CONTENT_TYPE, ToggleLikeDto } from './dto/toggle-like.dto';
import { Video } from 'src/videos/entities';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { User } from 'src/auth/user/user.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(NumberIdLike)
    private readonly numberLikesRepository: Repository<NumberIdLike>,
    @InjectRepository(StringIdLike)
    private readonly stringLikesRepository: Repository<StringIdLike>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * [Public] 클라이언트가 호출하는 유일한 '좋아요' 토글 엔드포인트입니다.
   * postId의 타입에 따라 적절한 내부 토글 메서드를 호출합니다.
   * @param userId - 좋아요를 누른 사용자의 ID
   * @param toggleLikeDto - 좋아요 대상 정보 (contentType, postId)
   * @returns 좋아요가 추가되면 true, 삭제되면 false를 반환합니다.
   */
  async toggleLike(
    userId: string,
    toggleLikeDto: ToggleLikeDto,
  ): Promise<boolean> {
    const { postId } = toggleLikeDto;

    if (typeof postId === 'number') {
      return this.toggleNumberLike(
        userId,
        toggleLikeDto as { contentType: CONTENT_TYPE; postId: number },
      );
    }

    if (typeof postId === 'string') {
      return this.toggleStringLike(
        userId,
        toggleLikeDto as { contentType: CONTENT_TYPE; postId: string },
      );
    }

    throw new BadRequestException('postId는 숫자 또는 문자열이어야 합니다.');
  }

  // --- Private Helper Methods --- //

  private async toggleNumberLike(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: number },
  ): Promise<boolean> {
    const { contentType, postId } = dto;
    const existingLike = await this.numberLikesRepository.findOne({
      where: { userId, contentType, postId },
    });

    let isLiked: boolean;

    if (existingLike) {
      await this.numberLikesRepository.remove(existingLike);
      isLiked = false;
    } else {
      const newLike = this.numberLikesRepository.create({
        userId,
        contentType,
        postId,
      });
      await this.numberLikesRepository.save(newLike);
      isLiked = true;

      if (contentType === CONTENT_TYPE.COMMUNITY) {
        const post = await this.postsRepository.findOne({ where: { postId }, relations: ['user'] });
        const sender = await this.usersRepository.findOneBy({ id: userId });
        if (post?.user && sender && post.user.id !== userId) {
          await this.notificationsService.createAndSendNotification(
            post.user, sender, NotificationType.LIKE,
            `${sender.username}님이 회원님의 게시물을 좋아합니다.`,
            `/community/post/${post.postId}`,
          );
        }
      }
    }

    // 해당 콘텐츠의 좋아요 카운트 업데이트
    await this.updateContentLikesCount(contentType, postId, isLiked ? 1 : -1);
    return isLiked;
  }

  /**
   * [Private] 문자열 타입 postId의 좋아요를 토글합니다.
   */
  private async toggleStringLike(
    userId: string,
    dto: { contentType: CONTENT_TYPE; postId: string },
  ): Promise<boolean> {
    const { contentType, postId } = dto;
    const existingLike = await this.stringLikesRepository.findOne({
      where: { userId, contentType, postId },
    });

    let isLiked: boolean;

    if (existingLike) {
      await this.stringLikesRepository.remove(existingLike);
      isLiked = false;
    } else {
      const newLike = this.stringLikesRepository.create({
        userId,
        contentType,
        postId,
      });
      await this.stringLikesRepository.save(newLike);
      isLiked = true;
      
      if (contentType === CONTENT_TYPE.VINYL) {
        const video = await this.videoRepository.findOne({ where: { id: postId }, relations: ['user'] });
        const sender = await this.usersRepository.findOneBy({ id: userId });
        if (video?.user && sender && video.user.id !== userId) {
          await this.notificationsService.createAndSendNotification(
            video.user, sender, NotificationType.LIKE,
            `${sender.username}님이 회원님의 영상을 좋아합니다.`,
            `/shorts/${video.id}`,
          );
        }
      }
    }

    await this.updateContentLikesCount(contentType, postId, isLiked ? 1 : -1);
    return isLiked;
  }

  /**
   * [Private] 콘텐츠의 'likeCount'를 업데이트합니다.
   */
  private async updateContentLikesCount(
    contentType: CONTENT_TYPE,
    postId: number | string,
    changeValue: 1 | -1,
  ): Promise<void> {
    let repository: Repository<any>;
    let targetId: { [key: string]: number | string };

    switch (contentType) {
      case CONTENT_TYPE.COMMUNITY:
        // 'Post' 엔티티의 ID 컬럼이 'postId'라고 가정합니다.
        // 만약 'id'라면 { id: postId } 로 변경해야 합니다.
        if (typeof postId !== 'number') {
          console.warn(
            `COMMUNITY 콘텐츠 타입은 숫자 ID가 필요합니다: ${postId}`,
          );
          return;
        }
        repository = this.postsRepository;
        targetId = { postId: postId };
        break;

      case CONTENT_TYPE.VINYL:
        if (typeof postId !== 'string') {
          console.warn(`VINYL 타입은 문자열 ID가 필요합니다: ${postId}`);
          return;
        }
        repository = this.videoRepository;
        targetId = { id: postId };
        break;

      default:
        console.warn(
          `지원하지 않는 콘텐츠 타입(${contentType})의 좋아요 수 업데이트는 생략됩니다.`,
        );
        return;
    }

    // Race Condition 방지를 위해 increment/decrement 사용
    const operation = changeValue > 0 ? 'increment' : 'decrement';
    await repository[operation](targetId, 'likeCount', Math.abs(changeValue));
  }

  // --- 유틸리티 메서드 (숫자/문자열 ID 모두 지원) --- //

  /**
   * 특정 콘텐츠의 좋아요 수를 조회합니다.
   * @param contentType - 콘텐츠 타입
   * @param postId - 콘텐츠 ID (숫자 또는 문자열)
   * @returns 좋아요 수
   */
  async getLikesCount(
    contentType: CONTENT_TYPE,
    postId: number | string,
  ): Promise<number> {
    if (typeof postId === 'number') {
      return this.numberLikesRepository.count({
        where: { contentType, postId },
      });
    }
    if (typeof postId === 'string') {
      return this.stringLikesRepository.count({
        where: { contentType, postId },
      });
    }
    throw new BadRequestException('postId는 숫자 또는 문자열이어야 합니다.');
  }

  /**
   * 특정 사용자가 특정 콘텐츠에 좋아요를 눌렀는지 확인합니다.
   * @param userId - 사용자 ID
   * @param contentType - 콘텐츠 타입
   * @param postId - 콘텐츠 ID (숫자 또는 문자열)
   * @returns 좋아요 여부 (boolean)
   */
  async hasUserLiked(
    userId: string,
    contentType: CONTENT_TYPE,
    postId: number | string,
  ): Promise<boolean> {
    let count = 0;
    if (typeof postId === 'number') {
      // 이 블록 안에서 postId는 number 타입임이 보장됩니다.
      count = await this.numberLikesRepository.count({
        where: { userId, contentType, postId },
      });
    } else {
      // 이 블록 안에서 postId는 string 타입임이 보장됩니다.
      count = await this.stringLikesRepository.count({
        where: { userId, contentType, postId },
      });
    }
    return count > 0;
  }

  /**
   * [수정됨] 특정 사용자가 여러 콘텐츠에 대해 좋아요를 눌렀는지 일괄 조회합니다.
   */
  async getUserLikedStatusesForContents(
    userId: string | undefined,
    contentType: CONTENT_TYPE,
    postIds: (number | string)[],
  ): Promise<Set<number | string>> {
    if (!userId || postIds.length === 0) {
      return new Set();
    }

    const numberIds = postIds.filter(
      (id): id is number => typeof id === 'number',
    );
    const stringIds = postIds.filter(
      (id): id is string => typeof id === 'string',
    );

    // 최종 ID들을 담을 배열
    const likedIds: (string | number)[] = [];

    // 각 프로미스를 따로 실행하여 타입 정보를 유지합니다.
    if (numberIds.length > 0) {
      const numberLikes = await this.numberLikesRepository.find({
        select: ['postId'],
        where: { userId, contentType, postId: In(numberIds) },
      });
      // numberLikes는 NumberIdLike[] 타입임이 보장됩니다.
      numberLikes.forEach((like) => likedIds.push(like.postId));
    }

    if (stringIds.length > 0) {
      const stringLikes = await this.stringLikesRepository.find({
        select: ['postId'],
        where: { userId, contentType, postId: In(stringIds) },
      });
      // stringLikes는 StringIdLike[] 타입임이 보장됩니다.
      stringLikes.forEach((like) => likedIds.push(like.postId));
    }

    return new Set(likedIds);
  }
}
