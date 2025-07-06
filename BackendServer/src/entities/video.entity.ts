import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user/user.entity';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Video, (video) => video.children, { nullable: true })
  @JoinColumn({ name: 'parent_video_id' })
  parent: Video;

  @Column({ nullable: true })
  parent_video_id: string;

  @OneToMany(() => Video, (video) => video.parent)
  children: Video[];

  @Column({ default: 0 })
  depth: number;

  @Column()
  results_video_key: string;

  @Column()
  source_video_key: string;

  @Column()
  thumbnail_key: string;

  @Column({ default: 0 })
  like_count: number;

  @Column({ default: 0 })
  comment_count: number;

  @CreateDateColumn()
  created_at: Date;

  // These are not columns in the database
  video_url?: string;
  thumbnail_url?: string;
}
