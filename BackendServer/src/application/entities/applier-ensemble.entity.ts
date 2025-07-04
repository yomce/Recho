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
  @PrimaryGeneratedColumn()
  applierId: number;

  @ManyToOne(
    () => RecruitEnsemble,
    (recruitEnsemble) => recruitEnsemble.applierEnsemble,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'postId' })
  recruitEnsemble: RecruitEnsemble;

  @ManyToOne(
    () => SessionEnsemble,
    (sessionEnsemble) => sessionEnsemble.applierEnsemble,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'sessionId' })
  sessionEnsemble: SessionEnsemble;

  @Column()
  username: string;

  @Column()
  applicationStatus: APPLICATION_STATUS;

  @CreateDateColumn()
  appliedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  approvedAt: Date | null;
}
