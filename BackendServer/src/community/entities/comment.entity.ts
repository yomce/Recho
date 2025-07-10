import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Post } from './post.entity';
import { User } from '../../auth/user/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

   @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' }) // eager: true로 댓글 조회 시 작성자 정보 자동 로드
  @JoinColumn({ name: 'author_id' }) // 실제 데이터베이스에 생성될 외래 키 컬럼 이름
  author: User;

  // Post와 다대일(N:1) 관계 설정
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}