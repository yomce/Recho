import { User } from 'src/auth/user/user.entity';
import { RecruitEnsemble } from 'src/ensemble/entities/recruit-ensemble.entity';
import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum APPLICATION_STATUS {
  WAITING,
  APPROVAL,
  REJECT,
  CANCEL,
}

@Entity({ name: 'applier_ensemble' })
export class ApplierEnsemble {
  @PrimaryGeneratedColumn({
    name: 'application_id',
  })
  applicationId: number;

  @ManyToOne(
    () => RecruitEnsemble,
    (recruitEnsemble) => recruitEnsemble.applierEnsemble,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'post_id' })
  recruitEnsemble: RecruitEnsemble;

  @ManyToOne(
    () => SessionEnsemble,
    (sessionEnsemble) => sessionEnsemble.applierEnsemble,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'session_id' })
  sessionEnsemble: SessionEnsemble;

  /**
   * User
   */
  @ManyToOne(() => User, (user) => user.applierEnsemble, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: User;

  /**
   * 지원 상태
   */
  @Column({
    type: 'enum',
    enum: APPLICATION_STATUS,
    name: 'application_status',
  })
  applicationStatus: APPLICATION_STATUS;

  /**
   * 지원 일시
   */
  @CreateDateColumn({
    type: 'timestamp',
    name: 'applied_at',
  })
  appliedAt: Date;

  /**
   * 최종 승인(합격) 일시
   */
  @Column({
    type: 'timestamp',
    name: 'approved_at',
    nullable: true,
  })
  approvedAt: Date | null;
}
