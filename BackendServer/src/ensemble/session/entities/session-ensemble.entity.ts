import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { RecruitEnsemble } from 'src/ensemble/entities/recruit-ensemble.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'recruit_session' })
export class SessionEnsemble {
  @PrimaryGeneratedColumn({
    name: 'session_id',
  })
  sessionId: number;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'instrument',
  })
  instrument: string;

  @Column({
    type: 'int',
    name: 'recruit_count',
  })
  recruitCount: number;

  @Column({
    type: 'int',
    name: 'now_recruit_count',
    default: 0,
  })
  nowRecruitCount: number;

  @ManyToOne(
    () => RecruitEnsemble,
    (recruitEnsemble) => recruitEnsemble.sessionEnsemble,
    {
      //모집글 삭제 시 세션 정보도 삭제
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'post_id' })
  recruitEnsemble: RecruitEnsemble;

  @OneToMany(
    () => ApplierEnsemble,
    (applierEnsemble) => applierEnsemble.sessionEnsemble,
  )
  applierEnsemble: ApplierEnsemble[];
}
