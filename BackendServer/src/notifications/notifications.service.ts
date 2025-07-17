// src/notifications/notifications.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async createAndSendNotification(
    recipient: User, sender: User, type: NotificationType, message: string, link: string
  ): Promise<void> {
    const notification = this.notificationRepo.create({ recipient, sender, type, message, link });
    const savedNotification = await this.notificationRepo.save(notification);
    this.notificationsGateway.sendNotificationToUser(recipient.id, savedNotification);
  }
}