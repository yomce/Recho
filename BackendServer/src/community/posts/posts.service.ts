// src/posts/posts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * 새 게시물을 생성합니다.
   * @param createPostDto - 게시물 생성에 필요한 데이터
   */
  create(createPostDto: CreatePostDto): Promise<Post> {
    const newPost = this.postsRepository.create(createPostDto);
    return this.postsRepository.save(newPost);
  }

  /**
   * 모든 게시물을 최신순으로 조회합니다. 카테고리 필터링을 지원합니다.
   * @param category - 필터링할 카테고리 이름
   */
   async findAll(category?: string): Promise<Post[]> {
    // ⭐️ 1. TypeORM의 FindManyOptions 타입으로 명확하게 정의합니다.
    const findOptions: FindManyOptions<Post> = {
      order: {
        createdAt: 'DESC',
      },
    };

    // ⭐️ 2. 카테고리 값이 유효할 경우에만 where 조건을 추가합니다.
    if (category && category !== '전체') {
      findOptions.where = {
        category: category,
      };
    }

    // ⭐️ 3. 완성된 옵션으로 데이터를 조회합니다.
    return this.postsRepository.find(findOptions);
  }


  /**
   * 특정 ID의 게시물을 조회합니다.
   * @param id - 조회할 게시물의 ID
   */
  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOneBy({ id });
    if (!post) {
      // 게시물이 없으면 404 에러를 던집니다.
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    return post;
  }

  // TODO: 게시물 수정(update), 삭제(remove) 메서드 추가
 

}