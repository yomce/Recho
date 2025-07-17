// src/comments/entities/number_id_comment.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';

@Entity('number_id_comment')
@Index(['content_type', 'post_id']) // 스네이크 케이스 인덱스
export class NumberIdComment {
  @PrimaryGeneratedColumn()
  id: number;

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
}
