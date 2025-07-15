// src/likes/likes.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // 'In' 연산자 임포트
import { CONTENT_TYPE, Like } from './entities/like.entity';
import { CreateLikeDto } from './dto/like.dto'; // DTO 경로 확인
import { PostsService } from 'src/community/posts/posts.service';
import { Post } from 'src/community/entities/post.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    // 필요하다면 다른 서비스 (예: PostsService, ArticlesService)를 여기에 주입하여
    // 좋아요를 누르려는 콘텐츠가 실제로 존재하는지 검증하는 로직을 추가할 수 있습니다.
    @Inject(forwardRef(() => PostsService))
    private postsService: PostsService,
  ) {}

  /**
   * 좋아요를 추가합니다. (토글 API가 있다면 이 메서드는 내부적으로만 사용되거나 관리자 기능용으로 남길 수 있습니다.)
   * 이미 좋아요를 눌렀거나, 존재하지 않는 콘텐츠 타입/ID일 경우 예외를 발생시킵니다.
   * @param userId 좋아요를 누른 사용자의 ID
   * @param createLikeDto 좋아요 대상 정보 (contentType, postId)
   * @returns 생성된 좋아요 객체
   */
  async createLike(
    userId: string,
    createLikeDto: CreateLikeDto,
  ): Promise<Like> {
    const { contentType, postId } = createLikeDto;

    // 중복 좋아요 방지 (Unique Index 덕분에 DB에서도 막히지만, 명시적 에러 처리)
    const existingLike = await this.likesRepository.findOne({
      where: { userId, contentType, postId },
    });

    if (existingLike) {
      throw new ConflictException('이미 좋아요를 눌렀습니다.');
    }

    // 여기서 실제 postId와 contentType이 유효한지 (예: Article 테이블에 해당 ID가 있는지)
    // 추가적인 검증 로직을 넣을 수 있습니다. (주입된 다른 서비스 사용)
    // 예: await this.postsService.validatePostExists(postId, contentType);

    const newLike = this.likesRepository.create({
      userId,
      contentType,
      postId,
    });

    return this.likesRepository.save(newLike);
  }

  /**
   * 좋아요를 취소합니다. (토글 API가 있다면 이 메서드는 내부적으로만 사용되거나 관리자 기능용으로 남길 수 있습니다.)
   * @param userId 좋아요를 취소할 사용자의 ID
   * @param contentType 좋아요 대상의 타입
   * @param postId 좋아요 대상의 ID
   * @returns 삭제 성공 여부 (true/false)
   */
  async removeLike(
    userId: string,
    contentType: CONTENT_TYPE,
    postId: number,
  ): Promise<boolean> {
    const likeToRemove = await this.likesRepository.findOne({
      where: { userId, contentType, postId },
    });

    if (!likeToRemove) {
      throw new NotFoundException('해당 좋아요를 찾을 수 없습니다.');
    }

    await this.likesRepository.remove(likeToRemove);
    return true;
  }

  /**
   * 좋아요를 토글합니다. (좋아요 없으면 추가, 있으면 삭제)
   * 이것이 클라이언트에서 좋아요 버튼 클릭 시 주로 사용될 메서드입니다.
   * @param userId 좋아요를 누르거나 취소할 사용자의 ID
   * @param createLikeDto 좋아요 대상 정보 (contentType, postId)
   * @returns 좋아요 추가/삭제 여부 (true: 추가됨, false: 삭제됨)
   */
  async toggleLike(
    userId: string,
    createLikeDto: CreateLikeDto,
  ): Promise<boolean> {
    const { contentType, postId } = createLikeDto;

    console.log('create like');
    console.log(createLikeDto);

    const existingLike = await this.likesRepository.findOne({
      where: { userId, contentType, postId },
    });

    let isLiked: boolean;

    if (existingLike) {
      // 이미 좋아요를 눌렀다면, 좋아요 취소 (삭제)
      await this.likesRepository.remove(existingLike);
      isLiked = false; // 좋아요가 삭제되었음을 알림
    } else {
      // 좋아요를 누르지 않았다면, 좋아요 추가 (생성)
      // 여기에서도 콘텐츠 유효성 검사를 추가할 수 있습니다.
      const newLike = this.likesRepository.create({
        userId,
        contentType,
        postId,
      });
      await this.likesRepository.save(newLike);
      isLiked = true; // 좋아요가 추가되었음을 알림
    }

    await this.updateContentLikesCount(contentType, postId, isLiked ? 1 : -1);

    return isLiked;
  }

  /**
   * 특정 콘텐츠의 좋아요 수를 조회합니다.
   * @param contentType 콘텐츠 타입
   * @param postId 콘텐츠 ID
   * @returns 좋아요 수
   */
  async getLikesCount(
    contentType: CONTENT_TYPE,
    postId: number,
  ): Promise<number> {
    return this.likesRepository.count({
      where: { contentType, postId },
    });
  }

  /**
   * 특정 사용자가 특정 콘텐츠에 좋아요를 눌렀는지 확인합니다.
   * @param userId 사용자 ID
   * @param contentType 콘텐츠 타입
   * @param postId 콘텐츠 ID
   * @returns 좋아요 여부 (boolean)
   */
  async hasUserLiked(
    userId: string,
    contentType: CONTENT_TYPE,
    postId: number,
  ): Promise<boolean> {
    const count = await this.likesRepository.count({
      where: { userId, contentType, postId },
    });
    return count > 0;
  }

  /**
   * 특정 사용자가 여러 콘텐츠에 대해 좋아요를 눌렀는지 일괄 조회합니다. (N+1 쿼리 해결용)
   * 이 메서드는 게시물 목록을 가져올 때 '내가 좋아요 했는지' 여부를 표시하는 데 사용됩니다.
   * @param userId 사용자 ID
   * @param contentType 콘텐츠 타입 (예: CONTENT_TYPE.ARTICLE)
   * @param postIds 좋아요 여부를 확인할 콘텐츠 ID 배열
   * @returns 좋아요를 누른 콘텐츠 ID들의 Set (빠른 조회를 위함)
   */
  async getUserLikedStatusesForContents(
    userId: string | undefined,
    contentType: CONTENT_TYPE,
    postIds: number[],
  ): Promise<Set<number>> {
    if (postIds.length === 0) {
      return new Set<number>();
    }

    const likedRecords = await this.likesRepository.find({
      select: ['postId'], // postId만 선택하여 전송 데이터 및 처리량 최소화
      where: {
        userId: userId,
        contentType: contentType,
        postId: In(postIds), // postIds 배열에 포함된 것들만 한 번의 쿼리로 조회
      },
    });

    // 조회된 레코드에서 postId만 추출하여 Set으로 변환. Set은 .has() 메서드를 통해 O(1) 시간 복잡도로 빠르게 검색 가능합니다.
    return new Set(likedRecords.map((record) => record.postId));
  }

  private async updateContentLikesCount(
    contentType: CONTENT_TYPE,
    postId: number,
    changeValue: 1 | -1,
  ): Promise<void> {
    let repository: Repository<any>; // 어떤 리포지토리인지 동적으로 결정
    // let entityName: string;

    switch (contentType) {
      case CONTENT_TYPE.COMMUNITY:
        repository = this.postsRepository;
        // entityName = 'Post';
        break;
      default:
        // 지원하지 않는 콘텐츠 타입에 대한 좋아요 카운트 업데이트 시 로깅 또는 에러 처리
        console.warn(
          `Unsupported content type for likes_count update: ${contentType}`,
        );
        return;
    }

    // TypeORM의 increment/decrement 기능을 사용하여 안전하게 업데이트
    // 이는 Race Condition을 방지하는 데 도움이 됩니다.
    if (changeValue > 0) {
      await repository.increment({ id: postId }, 'likeCount', changeValue);
    } else {
      await repository.decrement(
        { id: postId },
        'likeCount',
        Math.abs(changeValue),
      );
    }
  }
}
