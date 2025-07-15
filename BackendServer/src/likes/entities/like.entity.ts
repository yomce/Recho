import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { Post } from '../../community/entities/post.entity';

export enum CONTENT_TYPE {
  VINYL = 'vinyl',
  COMMUNITY = 'community',
  COMMENT = 'comment',
}

@Entity('like')
export class Like {
  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @PrimaryColumn()
  userId: string;

  // 'article', 'photo', 'video', 'comment' 등 좋아요 대상의 타입
  @Column()
  contentType: CONTENT_TYPE;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId', referencedColumnName: 'postId' })
  post: Post;
}
