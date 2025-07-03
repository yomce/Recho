import { Column } from 'typeorm';

export class CreateSessionEnsembleDto {
  @Column()
  sessionId?: number;

  @Column()
  instrument: string;

  @Column()
  recruitCount: number;
}

export class UpdateSessionDto {
  @Column()
  sessionId: number;

  @Column()
  instrument: string;

  @Column()
  recruitCount: number;
}
