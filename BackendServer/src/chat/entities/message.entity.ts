import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, JoinColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../auth/user/user.entity';


export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}


@Entity('message')
@Index(['roomId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid', { name: 'msg_id' })
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, room => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'sender', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, user => user.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender' })
  sender: User;

  @Column({ type: 'enum', enum: ['TEXT', 'IMAGE', 'FILE'], default: 'TEXT' })
  type: 'TEXT' | 'IMAGE' | 'FILE';

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;
}