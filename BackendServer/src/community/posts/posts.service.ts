// src/posts/posts.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostLike } from '../entities/post-like.entity';

// ⭐️ req.user 객체의 타입을 명시적으로 정의하여 실수를 방지합니다.
type AuthenticatedUser = { id: string; name: string; };

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikesRepository: Repository<PostLike>,
    private readonly dataSource: DataSource,
  ) {}

  create(createPostDto: CreatePostDto, user: AuthenticatedUser): Promise<Post> {
    if (!user || !user.name) {
      throw new BadRequestException('유효한 사용자 정보가 없어 게시글을 생성할 수 없습니다.');
    }
    const newPost = this.postsRepository.create({
      ...createPostDto,
      author: user.name, // ⭐️ user.name을 사용합니다.
      likeCount: 0,
      commentCount: 0,
    });
    return this.postsRepository.save(newPost);
  }

  async findAll(category: string | undefined, user: AuthenticatedUser | undefined): Promise<any[]> {
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
        .orderBy('post.createdAt', 'DESC');

    if (category && category !== '전체') {
      queryBuilder.where('post.category = :category', { category });
    }
    
    const posts = await queryBuilder.getMany();

    if (user && user.id) {
      const likedPostIds = (await this.postLikesRepository.find({
        where: { userId: user.id },
        select: ['postId'],
      })).map(like => like.postId);

      return posts.map(post => ({
        ...post,
        isLiked: likedPostIds.includes(post.id),
      }));
    }
    return posts.map(post => ({ ...post, isLiked: false }));
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    return post;
  }

  async remove(postId: number, user: AuthenticatedUser): Promise<void> {
    const post = await this.postsRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('삭제하려는 게시물을 찾을 수 없습니다.');
    }
    // ⭐️ post.author와 user.name을 비교합니다.
    if (post.author !== user.name) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }
    await this.postsRepository.delete(postId);
  }

  async toggleLike(postId: number, user: AuthenticatedUser): Promise<{ liked: boolean; likeCount: number }> {
    if (!user || !user.id) {
      throw new ForbiddenException('사용자 ID가 없어 좋아요를 처리할 수 없습니다.');
    }
    const userId = user.id;

    return this.dataSource.transaction(async (manager) => {
      const postRepository = manager.withRepository(this.postsRepository);
      const postLikeRepository = manager.withRepository(this.postLikesRepository);

      const post = await postRepository.findOneBy({ id: postId });
      if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');
      
      const like = await postLikeRepository.findOneBy({ postId, userId });

      if (like) {
        await postLikeRepository.delete({ postId, userId });
        post.likeCount = Math.max(0, post.likeCount - 1);
        const updatedPost = await postRepository.save(post);
        return { liked: false, likeCount: updatedPost.likeCount };
      } else {
        const newLike = postLikeRepository.create({ postId, userId });
        await postLikeRepository.save(newLike);
        post.likeCount = (post.likeCount || 0) + 1;
        const updatedPost = await postRepository.save(post);
        return { liked: true, likeCount: updatedPost.likeCount };
      }
    });
  }
}
