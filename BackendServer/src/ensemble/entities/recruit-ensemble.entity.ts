// src/entities/used-product.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEnsemble } from '../session/entities/session-ensemble.entity';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { User } from 'src/auth/user/user.entity';

export enum SKILL_LEVEL {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  PROFESSIONAL,
}

export enum RECRUIT_STATUS {
  RECRUITING,
  COMPLETE,
  CANCEL,
}

@Entity({ name: 'recruit_ensemble' })
export class RecruitEnsemble {
  @PrimaryGeneratedColumn({
    name: 'post_id',
  })
  postId: number;

  @ManyToOne(() => User, (user) => user.recruitEnsemble, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'title',
  })
  title: string;

  @Column({
    type: 'text',
    name: 'content',
  })
  content: string;

  @Column({
    type: 'timestamp',
    name: 'event_date',
  })
  eventDate: Date;

  @Column({
    type: 'enum',
    enum: SKILL_LEVEL,
    name: 'skill_level',
  })
  skillLevel: SKILL_LEVEL;

  @Column({
    type: 'int',
    name: 'location_id',
  })
  locationId: number;

  @Column({
    type: 'int',
    name: 'total_recruit_cnt',
  })
  totalRecruitCnt: number;

  @Column({
    type: 'enum',
    enum: RECRUIT_STATUS,
    name: 'recruit_status',
    default: RECRUIT_STATUS.RECRUITING,
  })
  recruitStatus: RECRUIT_STATUS;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'int',
    name: 'view_count',
    default: 0,
  })
  viewCount: number;

  @OneToMany(
    () => SessionEnsemble,
    (sessionEnsemble) => sessionEnsemble.recruitEnsemble,
  )
  sessionEnsemble: SessionEnsemble[];

  @OneToMany(
    () => ApplierEnsemble,
    (applierEnsemble) => applierEnsemble.recruitEnsemble,
  )
  applierEnsemble: ApplierEnsemble[];
}
