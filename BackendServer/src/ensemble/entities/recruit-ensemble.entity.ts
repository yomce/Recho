// src/entities/used-product.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
  @PrimaryGeneratedColumn()
  postId: number;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  eventDate: Date;

  @Column()
  skillLevel: SKILL_LEVEL;

  @Column()
  locationId: number;

  @Column()
  instrument_category_id: number;

  @Column()
  total_recruit_cnt: number;

  @Column({ default: RECRUIT_STATUS.RECRUITING })
  recruit_status: RECRUIT_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
  viewCount: number;

  // @Column()
  // roomId: number;
}
