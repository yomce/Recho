import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'recruit_session' })
export class SessionEnsemble {
  @PrimaryGeneratedColumn()
  sessionId: number;

  @Column()
  postId: number;

  @Column()
  instrument: string;

  @Column()
  recruitCount: number;
}
