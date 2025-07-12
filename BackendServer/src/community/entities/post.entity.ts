// src/posts/entities/post.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany, 
  ManyToOne, 
  JoinColumn, 

} from 'typeorm';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { User } from '../../auth/user/user.entity'; // ✅ User 엔티티 임포트


@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  author: string; // 표시용 닉네임은 그대로 유지

  // ✅ 시작: User와의 관계 설정
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
  // ✅ 끝: User와의 관계 설정

  @Column({ length: 255, nullable: true })
  authorProfileUrl?: string;

  @Column({ length: 50 })
  category: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];
}