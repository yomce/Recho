// src/notifications/entities/notification.entity.ts

import { User } from '../../auth/user/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  message: string;

  @Column()
  link: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}