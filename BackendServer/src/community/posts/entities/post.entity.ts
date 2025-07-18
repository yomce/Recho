// src/posts/entities/post.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../../auth/user/user.entity';
import { NumberIdComment } from '../../../comment/entities/number-id-comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  postId: number;

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

  @OneToMany(() => NumberIdComment, (comment) => comment.post)
  comments: NumberIdComment[];
}
