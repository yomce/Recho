// src/notifications/notifications.gateway.ts

import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'notifications', // 채팅과 구분하기 위해 별도의 경로 사용
  cors: {
    origin: ['https://recho.cloud', 'http://localhost:5173'],
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    if (userId) {
      client.join(userId); // 클라이언트를 userId 이름의 방에 입장시킴
    }
  }

  sendNotificationToUser(userId: string, notificationData: any) {
    this.server.to(userId).emit('newNotification', notificationData);
  }
}