// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateUserDto } from '../auth/user/dto/create-user.dto';
import { UserService } from '../auth/user/user.service'; // 경로 확인

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService, // ← 추가
  ) {}

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.chatService.createRoom(dto.name, dto.type);
    client.emit('roomCreated', room);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: { roomId: string; id: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.joinRoom(payload.id, payload.roomId);
    client.join(payload.roomId);
    this.server.to(payload.roomId).emit('userJoined', payload.id);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    // 클라이언트가 보낸 payload. senderName을 추가로 받습니다.
    @MessageBody()
    payload: {
      roomId: string;
      senderId: string;
      senderName: string; // 보낸 사람의 이름을 함께 받습니다.
      content: string;
    },
  ) {
    // 1. 받은 메시지를 DB에 저장합니다.
    const message = await this.chatService.saveMessage(payload);

    // 2. DB에 저장된 message 객체에 보낸 사람의 이름을 추가합니다.
    //    이렇게 하면 다른 클라이언트들이 누가 보냈는지 쉽게 알 수 있습니다.
    const messageWithSenderName = {
      ...message,
      senderName: payload.senderName,
    };

    // 3. 'to(roomId)'를 사용해 메시지를 보낸 사람을 포함한
    //    해당 방의 모든 클라이언트에게 'newMessage' 이벤트를 보냅니다.
    this.server.to(payload.roomId).emit('newMessage', messageWithSenderName);
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    // [수정] payload에 id를 추가로 받도록 타입을 수정합니다.
    @MessageBody()
    payload: {
      roomId: string;
      id: string; // id를 필수로 받습니다.
      page?: number;
      limit?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // [수정] chatService.getHistory 호출 시 payload에서 받은 id를 전달합니다.
    const history = await this.chatService.getHistory(
      payload.roomId,
      payload.id, // id 전달
      payload.page,
      payload.limit,
    );
    client.emit('history', history);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: { roomId: string; id: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 1. DB에서 사용자 정보를 조회하여 이름을 가져옵니다.
    const user = await this.userService.findById(payload.id);

    // 2. ChatService를 통해 사용자를 방에서 내보냅니다.
    await this.chatService.leaveRoom(payload.id, payload.roomId);
    client.leave(payload.roomId);

    // 3. 방에 남아있는 다른 사용자들에게 'username'을 포함하여 이벤트를 전송합니다.
    this.server.to(payload.roomId).emit('userLeft', {
      id: payload.id,
      username: user ? user.username : '알 수 없는 사용자', // 유저가 존재하면 username, 없으면 기본값
    });
  }

  @SubscribeMessage('createUser')
  async handleCreateUser(
    @MessageBody() dto: CreateUserDto,
    @ConnectedSocket() client: Socket,
  ) {
    // userService 를 주입해 두셨다고 가정
    const user = await this.userService.createUser(dto);
    client.emit('userCreated', { id: user.id, name: user.username });
  }

  @SubscribeMessage('inviteUser')
  async handleInviteUser(
    @MessageBody()
    payload: {
      roomId: string;
      inviteeId: string; // 초대받는 사람의 ID
    },
  ) {
    // 1. ChatService의 joinRoom을 사용해 초대받은 사람을 방에 참여시킵니다.
    await this.chatService.joinRoom(payload.inviteeId, payload.roomId);

    // 2. 해당 방에 있는 모든 사람에게 새로운 유저가 참여했음을 알립니다.
    this.server.to(payload.roomId).emit('userJoined', payload.inviteeId);
  }
}