import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum APPLICATION_STATUS {
  WAITING,
  APPROVAL,
  REJECT,
  CANCEL,
}

@Entity({ name: 'apply_ensemble' })
export class ApplyEnsemble {
  @PrimaryGeneratedColumn()
  applicationId: number;

  @Column()
  postId: number;

  @Column()
  sessionId: number;

  @Column()
  userId: string;

  @Column()
  instrumentalCategoryId: number;

  @Column()
  applicationStatus: APPLICATION_STATUS;

  @CreateDateColumn()
  appliedAt: Date;

  @Column()
  approvedAt: Date;
}
