import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { CONTENT_TYPE } from '../dto/toggleLike.dto';

@Entity('stringIdLike')
export class StringIdLike {
  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @PrimaryColumn()
  userId: string;

  // 'article', 'photo', 'video', 'comment' 등 좋아요 대상의 타입
  @Column()
  contentType: CONTENT_TYPE;

  @PrimaryColumn()
  postId: string;
}
