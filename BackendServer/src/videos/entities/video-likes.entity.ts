import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// PrimaryGeneratedColum은 자동으로 증가하는 값을 생성해줌

@Entity('video_likes')
export class VideoLike {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'video_id', type: 'bigint' })
  videoId: number;
}
