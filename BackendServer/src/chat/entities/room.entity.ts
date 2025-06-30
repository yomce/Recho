import { PrimaryColumn, Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Message } from './message.entity';
import { UserRoom } from './user-room.entity';

@Entity('room')
export class Room {
  @PrimaryColumn('varchar', { length: 255, name: 'room_id' })
  id: string;

  @Column({ name: 'room_name', nullable: true })
  name?: string;

  @Column({ type: 'enum', enum: ['PRIVATE', 'GROUP'], default: 'PRIVATE' })
  type: 'PRIVATE' | 'GROUP';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_message_at' })
  lastMessageAt: Date;

  @OneToMany(() => Message, m => m.room)
  messages: Message[];

  @OneToMany(() => UserRoom, ur => ur.room)
  userRooms: UserRoom[];
}