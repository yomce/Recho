// src/posts/posts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/auth/user/user.entity';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';
import { LikesService } from 'src/likes/likes.service';
import { CommentsService } from 'src/comment/comments.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
  ) {}

  create(createPostDto: CreatePostDto, user: User): Promise<Post> {
    console.log(user);

    if (!user || !user.username) {
      throw new BadRequestException(
        '유효한 사용자 정보가 없어 게시글을 생성할 수 없습니다.',
      );
    }
    const newPost = this.postsRepository.create({
      ...createPostDto,
      author: user.username,
      userId: user.id,
      likeCount: 0,
      commentCount: 0,
    });
    return this.postsRepository.save(newPost);
  }

  /**
   * [수정됨] ID로 단일 게시물을 조회하며, 좋아요 상태와 전체 댓글 목록을 포함합니다.
   * @param id 게시물 ID
   * @param user 현재 로그인한 사용자 (선택 사항)
   * @returns 게시물 상세 정보 (좋아요 상태, 댓글 목록 포함)
   */
  async findOne(id: number, user: User | undefined): Promise<any> {
    // 1. 게시물과 작성자 정보를 함께 조회
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'author')
      .where('post.postId = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }

    // 2. 좋아요 상태와 댓글 목록을 병렬로 조회
    const [userLiked, comments] = await Promise.all([
      user
        ? this.likesService.hasUserLiked(user.id, CONTENT_TYPE.COMMUNITY, id)
        : false,
      this.commentsService.getComments(CONTENT_TYPE.COMMUNITY, id),
    ]);

    // 3. 모든 정보를 합쳐 최종 응답 객체 생성
    return {
      ...post,
      author: post.user ? post.user.username : '탈퇴한 사용자',
      authorProfileUrl: post.user ? post.user.profileUrl : null,
      user: undefined, // 민감 정보인 전체 user 객체는 제거
      userLiked, // 좋아요 여부
      comments, // 전체 댓글 목록
    };
  }

  /**
   * 모든 게시물을 조회하고, 각 게시물에 대해 현재 사용자의 좋아요 여부를 포함합니다.
   * @param userId 로그인한 사용자의 ID (인증 가드를 통해 전달)
   * @returns 게시물 리스트와 각 게시물의 좋아요 상태
   */
  async findAllPostsWithDetails(
    category: string | undefined,
    user: User | undefined,
    paginationQuery?: { page?: number; limit?: number },
  ): Promise<any[]> {
    const page = paginationQuery?.page || 1;
    const limit = paginationQuery?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (category && category !== '전체') {
      queryBuilder.where('post.category = :category', { category });
    }

    const posts = await queryBuilder.getMany();

    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post.postId);

    const [userLikedPostIds, commentsMap] = await Promise.all([
      user
        ? this.likesService.getUserLikedStatusesForContents(
            user.id,
            CONTENT_TYPE.COMMUNITY,
            postIds,
          )
        : new Set<number>(),
      this.commentsService.findRecentCommentsForPosts(
        CONTENT_TYPE.COMMUNITY,
        postIds,
      ),
    ]);

    const responsePosts = posts.map((post) => {
      const commentsForPost = commentsMap.get(post.postId) || []; // 👈 Map에서 댓글 조회

      return {
        ...post,
        author: post.user ? post.user.username : '탈퇴한 사용자',
        authorProfileUrl: post.user ? post.user.profileUrl : null,
        user: undefined, // 민감 정보 제외
        userLiked: userLikedPostIds.has(post.postId),
        comments: commentsForPost,
      };
    });

    return responsePosts;
  }

  /**
   * 게시물을 삭제합니다.
   * @param postId 삭제할 게시물 ID
   * @param user 요청한 사용자 정보
   */
  async remove(postId: number, user: User): Promise<void> {
    const post = await this.postsRepository.findOneBy({ postId: postId });

    if (!post) {
      throw new NotFoundException('삭제하려는 게시물을 찾을 수 없습니다.');
    }
    if (post.userId !== user.id) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.delete(postId);
  }
}
