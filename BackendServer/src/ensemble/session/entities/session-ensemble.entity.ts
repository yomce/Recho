import { RecruitEnsemble } from 'src/ensemble/entities/recruit-ensemble.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'recruit_session' })
export class SessionEnsemble {
  @PrimaryGeneratedColumn()
  sessionId: number;

  @Column()
  instrument: string;

  @Column()
  recruitCount: number;

  @Column()
  nowRecruitCount: number;

  @ManyToOne(
    () => RecruitEnsemble,
    (recruitEnsemble) => recruitEnsemble.sessionEnsemble,
    {
      //모집글 삭제 시 세션 정보도 삭제
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'postId' })
  recruitEnsemble: RecruitEnsemble;
}
