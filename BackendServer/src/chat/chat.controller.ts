// src/chat/chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { Room } from './entities/room.entity';
import { User } from '../auth/user/user.entity'; // User import
import { Request } from 'express'; // Request import
import { AuthGuard } from '@nestjs/passport'; // AuthGuard import
import { MessageResponseDto } from './dto/message.response.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('dm')
  @UseGuards(AuthGuard('jwt')) // 로그인이 필요한 API
  async createOrGetDmRoom(
    @Req() req: RequestWithUser, // 요청을 보낸 사용자(나)의 정보
    @Body('partnerId') partnerId: string, // DM을 보낼 상대방의 ID
  ) {
    const myId = req.user.id;
    if (!partnerId) {
      throw new Error('상대방의 ID가 필요합니다.');
    }
    return this.chatService.getOrCreatePrivateRoom(myId, partnerId);
  }
  // 1) 방 목록 조회
  @Get('rooms')
  async getRooms(): Promise<Room[]> {
    return this.chatService.getAllRooms();
  }

  // 2) 방 생성
  @Post('rooms')
  @UseGuards(AuthGuard('jwt')) // 1. JWT 인증 가드로 이 API를 보호합니다.
  async createRoom(
    @Body() dto: CreateRoomDto,
    @Req() req: RequestWithUser,
  ): Promise<Room> {
    // 2. 인증된 사용자 정보를 req.user에서 가져옵니다.
    const user = req.user;
    // 3. 서비스에 사용자 ID를 함께 넘겨줍니다.
    return this.chatService.createRoom(dto.name, dto.type, user.id);
  }

  // 3) 메시지 이력 조회
  @Get('rooms/:id/history')
  @UseGuards(AuthGuard('jwt'))
  async getHistory(
    @Param('id') roomId: string,
    @Query() query: HistoryQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<MessageResponseDto[]> {
    const userId = req.user.id;
    return this.chatService.getHistory(roomId, userId, query.page, query.limit);
  }

  // (신규) 읽음 처리 엔드포인트
  @Post('rooms/:id/read')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204) // 성공 시 내용 없이 204 No Content 반환
  async markAsRead(
    @Param('id') roomId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req.user.id;
    await this.chatService.markAsRead(roomId, userId);
  }

  // (신규) 전체 안 읽은 메시지 수 조회 엔드포인트
  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const count = await this.chatService.getTotalUnreadCount(userId);
    return { unreadCount: count };
  }

  // getMyRooms 반환 타입 수정
  @Get('my-rooms')
  @UseGuards(AuthGuard('jwt'))
  async getMyRooms(@Req() req: RequestWithUser): Promise<any[]> {
    // 반환 타입 수정
    const userId = req.user.id;
    return this.chatService.getRoomsForUser(userId);
  }

  @Get('rooms/:id')
  @UseGuards(AuthGuard('jwt'))
  async getRoomDetails(
    @Param('id') roomId: string,
    @Req() req: RequestWithUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.chatService.findRoomById(roomId, userId);
  }
}
