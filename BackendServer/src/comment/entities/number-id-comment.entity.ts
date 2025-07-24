// src/comments/entities/number_id_comment.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';
import { Post } from '../../community/posts/entities/post.entity';

@Entity('number_id_comment')
export class NumberIdComment {
  @PrimaryGeneratedColumn({ name: 'comment_id' })
  commentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'content_type' })
  contentType: CONTENT_TYPE;

  @Column({ name: 'post_id' })
  postId: number;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id', referencedColumnName: 'postId' })
  post: Post;
}
