import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('video_comments')
export class VideoComment {
  @PrimaryGeneratedColumn({ name: 'comment_id', type: 'bigint' })
  commentId: number;

  @Column({ name: 'video_id', type: 'bigint' })
  videoId: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'content', type: 'text' })
  content: string;
}
