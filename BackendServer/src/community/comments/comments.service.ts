import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post } from '../entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const post = await this.postsRepository.findOneBy({ id: createCommentDto.postId });
    if (!post) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    const newComment = this.commentsRepository.create({
      author: createCommentDto.author,
      content: createCommentDto.content,
      post: post,
    });
    
    // ⭐️ 게시물의 댓글 카운트 1 증가
    post.commentCount += 1;
    await this.postsRepository.save(post);

    return this.commentsRepository.save(newComment);
  }

  // 특정 게시물의 모든 댓글 조회
  findByPostId(postId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
    });
  }
}