// src/posts/posts.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/auth/user/user.entity';
import { LikesService } from 'src/stringIdLikes/likes.service';
import { CONTENT_TYPE } from 'src/stringIdLikes/dto/toggleLike.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    private readonly likesService: LikesService,
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

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOneBy({ postId: id });
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    return post;
  }

  async remove(postId: number, user: User): Promise<void> {
    const post = await this.postsRepository.findOneBy({ postId: postId });
    if (!post) {
      throw new NotFoundException('삭제하려는 게시물을 찾을 수 없습니다.');
    }
    // ✅ 닉네임(post.author) 대신 영구적인 ID(post.userId)로 권한을 확인합니다.
    if (post.userId !== user.id) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }
    await this.postsRepository.delete(postId);
  }

  /**
   * 모든 게시물을 조회하고, 각 게시물에 대해 현재 사용자의 좋아요 여부를 포함합니다.
   * @param userId 로그인한 사용자의 ID (인증 가드를 통해 전달)
   * @returns 게시물 리스트와 각 게시물의 좋아요 상태
   */
  async findAllPostsWithLikeStatus(
    category: string | undefined,
    user: User | undefined,
  ): Promise<any[]> {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      // ✅ User 엔티티를 조인하여 사용자 정보를 함께 선택합니다.
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post.createdAt', 'DESC');

    if (category && category !== '전체') {
      queryBuilder.where('post.category = :category', { category });
    }

    const posts = await queryBuilder.getMany();

    if (posts.length === 0) {
      return [];
    }

    const responsePosts = posts.map((post) => ({
      ...post,
      author: post.user ? post.user.username : '탈퇴한 사용자',
      authorProfileUrl: post.user ? post.user.profileUrl : null,
      // 유저 정보 유출 방지
      user: undefined,
    }));

    // 1. 모든 게시물의 ID를 추출
    const postIds = posts.map((post) => post.postId);

    // 2. LikesService를 통해 현재 사용자가 해당 게시물들에 좋아요를 눌렀는지 일괄 조회
    //    'post'는 해당 게시물의 contentType에 맞게 변경해야 합니다 (예: CONTENT_TYPE.ARTICLE)
    if (user) {
      const userLikedPostIds =
        await this.likesService.getUserLikedStatusesForContents(
          user.id,
          CONTENT_TYPE.COMMUNITY, // 또는 해당 게시물 엔티티의 CONTENT_TYPE
          postIds,
        );

      // 3. 각 게시물 객체에 'userLiked' 속성 추가
      const postsWithLikeStatus = responsePosts.map((post) => ({
        ...post,
        userLiked: userLikedPostIds.has(post.postId),
        // (옵션) 좋아요 개수도 함께 가져오려면 LikesService에 배치 조회 메서드 추가 후 사용
      }));

      console.log(postsWithLikeStatus);

      return postsWithLikeStatus;
    } else {
      const postsWithLikeStatus = responsePosts.map((post) => ({
        ...post,
        userLiked: false,
        // (옵션) 좋아요 개수도 함께 가져오려면 LikesService에 배치 조회 메서드 추가 후 사용
      }));

      return postsWithLikeStatus;
    }
  }
}
