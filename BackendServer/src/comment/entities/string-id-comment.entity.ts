// src/comments/entities/string_id_comment.entity.ts

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

@Entity('string_id_comment')
@Index(['content_type', 'post_id']) // 인덱스 컬럼도 snake_case로
export class StringIdComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'content_type' })
  contentType: CONTENT_TYPE;

  @Column({ name: 'post_id' })
  postId: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
