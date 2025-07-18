// src/likes/entities/string_id_like.entity.ts

import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { CONTENT_TYPE } from '../dto/toggle-like.dto';

@Entity('string_id_like')
export class StringIdLike {
  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ name: 'content_type' })
  contentType: CONTENT_TYPE;

  @PrimaryColumn({ name: 'post_id' })
  postId: string;
}
