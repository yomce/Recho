// src/entities/used-product.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEnsemble } from '../session/entities/session-ensemble.entity';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';

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
  totalRecruitCnt: number;

  @Column({ default: RECRUIT_STATUS.RECRUITING })
  recruitStatus: RECRUIT_STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
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
