import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Location } from 'src/map/entities/location.entity';
import { User } from 'src/auth/user/user.entity';

@Entity({ name: 'practice_rooms' })
export class PracticeRoom {
  @PrimaryGeneratedColumn()
  postId: number;

  @ManyToOne(() => User, (user: User) => user.practiceRoom, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Location, { eager: true })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column()
  locationId: number;

  @Column({ default: 0 })
  viewCount: number;
}
