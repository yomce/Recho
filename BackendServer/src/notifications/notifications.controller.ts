// src/notifications/notifications.controller.ts

import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { User } from 'src/auth/user/user.entity'; // User 타입을 명시적으로 사용하기 위해 import

// Request 객체에 user 타입이 포함되도록 인터페이스 확장
interface RequestWithUser extends Request {
  user: User;
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMyNotifications(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.notificationsService.getNotificationsForUser(userId);
  }

  @Patch('read')
  async markAsRead(
    @Req() req: RequestWithUser,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    const userId = req.user.id;
    await this.notificationsService.markAsRead(
      userId,
      markAsReadDto.notificationIds,
    );
    return { success: true };
  }
}
