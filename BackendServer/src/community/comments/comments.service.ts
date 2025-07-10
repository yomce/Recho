import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post } from '../entities/post.entity';
import { User } from '../../auth/user/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const post = await this.postsRepository.findOneBy({ id: createCommentDto.postId });
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const newComment = this.commentsRepository.create({
      content: createCommentDto.content,
      post: post,
      author: user, // ⭐️ User 객체를 직접 할당
    });

    // 게시물 댓글 수 업데이트
    post.commentCount = (post.commentCount || 0) + 1;
    await this.postsRepository.save(post);

    return this.commentsRepository.save(newComment);
  }

  findByPostId(postId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(commentId: number, user: User): Promise<void> {
    // ⭐️ 1. 댓글을 찾을 때, 연관된 'post' 정보도 함께 불러옵니다.
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'post'], 
    });

    if (!comment) {
      throw new NotFoundException('삭제하려는 댓글을 찾을 수 없습니다.');
    }
    if (comment.author.id !== user.id) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    // ⭐️ 2. 댓글 삭제 전에, 연결된 게시물의 commentCount를 1 감소시킵니다.
    if (comment.post) {
      const post = comment.post;
      // commentCount가 0보다 작아지지 않도록 방지합니다.
      post.commentCount = Math.max(0, post.commentCount - 1);
      await this.postsRepository.save(post);
    }

    // ⭐️ 3. 모든 작업이 끝난 후 댓글을 최종적으로 삭제합니다.
    await this.commentsRepository.delete(commentId);
  }
}