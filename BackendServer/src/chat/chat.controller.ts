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
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto, RoomType } from './dto/create-room.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { User } from '../auth/user/user.entity'; // User import
import { Request } from 'express'; // Request import
import { AuthGuard } from '@nestjs/passport'; // AuthGuard import

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
  @UseGuards(AuthGuard('jwt')) // [수정] JWT 가드를 추가하여 인증된 사용자만 접근 가능하도록 변경
  async getHistory(
    @Param('id') roomId: string,
    @Query() query: HistoryQueryDto,
    @Req() req: RequestWithUser, // [수정] 요청 객체에서 사용자 정보를 가져옴
  ): Promise<Message[]> {
    const id = req.user.id; // [수정] 현재 로그인한 사용자의 ID
    // [수정] 서비스 호출 시 id를 함께 전달
    return this.chatService.getHistory(roomId, id, query.page, query.limit);
  }

  @Get('my-rooms')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 가드로 보호
  async getMyRooms(@Req() req: RequestWithUser) {
    const user = req.user; // 'as User' 타입 단언이 더 이상 필요 없습니다.
    return this.chatService.getRoomsForUser(user.id);
  }
}