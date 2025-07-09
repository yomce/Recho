// src/posts/posts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * 모든 게시물을 최신순으로 조회합니다.
   */
  findAll(): Promise<Post[]> {
    return this.postsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 특정 ID의 게시물을 조회합니다.
   * @param id - 조회할 게시물의 ID
   */
  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    return post;
  }

  // TODO: 게시물 수정(update), 삭제(remove) 메서드 추가
}