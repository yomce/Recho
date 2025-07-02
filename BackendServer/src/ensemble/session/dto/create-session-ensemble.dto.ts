import { Column } from 'typeorm';

export class CreateSessionEnsembleDto {
  @Column()
  instrument: string;

  @Column()
  recruitCount: number;

  @Column()
  totalRecruitCount: number;
}
