// src/posts/entities/post.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany, // ⭐️ OneToMany 임포트

} from 'typeorm';
import { Comment } from './comment.entity';



@Entity('posts') // 데이터베이스 테이블 이름을 'posts'로 지정
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  author: string;

  @Column({ length: 255, nullable: true })
  authorProfileUrl?: string;

  @Column({ length: 50 })
  category: string;

  @Column({ length: 255 })
  title: string;

  @Column('text') // 긴 글을 저장하기 위해 'text' 타입 사용
  content: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post) // ⭐️ 1:N 관계 추가
  comments: Comment[];
}