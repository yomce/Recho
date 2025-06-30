import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/user/user.entity';
import { Room } from './room.entity';

@Entity('user_room')
export class UserRoom {
  @PrimaryColumn({ type: 'varchar', length: 255, name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 255, name: 'room_id' })
  roomId: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ManyToOne(() => User, (user: User) => user.userRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Room, (room: Room) => room.userRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
