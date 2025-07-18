import { Exclude } from 'class-transformer';
import { User } from 'src/auth/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.videos)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Video, (video) => video.children, { nullable: true })
  @JoinColumn({ name: 'parent_video_id' })
  parent: Video;

  @Column({ nullable: true })
  parent_video_id: string;

  @OneToMany(() => Video, (video) => video.parent)
  children: Video[];

  @Column({ default: 0 })
  depth: number;

  @Column({ type: 'float', default: 0 })
  startTime: number;

  @Column({ type: 'float', default: 0 })
  endTime: number;

  @Column({ type: 'float', default: 0 })
  timelinePosition: number;

  @Exclude()
  @Column()
  results_video_key: string;

  @Exclude()
  @Column()
  source_video_key: string;

  @Exclude()
  @Column()
  thumbnail_key: string;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @CreateDateColumn()
  created_at: Date;

  // These are not columns in the database
  video_url?: string;
  thumbnail_url?: string;
}
