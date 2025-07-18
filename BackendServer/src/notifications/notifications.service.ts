// src/notifications/notifications.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { User } from '../auth/user/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationIds?: string[]): Promise<void> {
    const whereCondition: FindOptionsWhere<Notification> = {
      recipient: { id: userId },
      isRead: false,
    };

    if (notificationIds && notificationIds.length > 0) {
      whereCondition.id = In(notificationIds);
    }

    await this.notificationRepo.update(whereCondition, { isRead: true });
  }

  // 기존 알림 생성 함수는 그대로 둡니다.
  async createAndSendNotification(
    recipient: User,
    sender: User,
    type: NotificationType,
    message: string,
    link: string,
  ): Promise<void> {
    const notification = this.notificationRepo.create({
      recipient,
      sender,
      type,
      message,
      link,
    });
    const savedNotification = await this.notificationRepo.save(notification);
    this.notificationsGateway.sendNotificationToUser(
      recipient.id,
      savedNotification,
    );
  }
}
