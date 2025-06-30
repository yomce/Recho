import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Room } from './entities/room.entity';
import { UserRoom } from './entities/user-room.entity';
import { Message } from './entities/message.entity';
import { RoomType } from './dto/create-room.dto';

// src/chat/chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(UserRoom) private urRepo: Repository<UserRoom>,
    @InjectRepository(UserRoom) private userRoomRepo: Repository<UserRoom>,
  ) {}

  async createRoom(
    name: string,
    type: RoomType,
    creatorId?: string,
  ): Promise<Room> {
    const room = this.roomRepo.create({
      id: uuidv4(),
      name,
      type,
    });
    const savedRoom = await this.roomRepo.save(room);

    // 만약 creatorId가 인자로 전달되었다면, 해당 유저를 방에 참여시킵니다.
    if (creatorId) {
      await this.joinRoom(creatorId, savedRoom.id);
    }

    return savedRoom;
  }

  // 2) 방 참여 (UserRoom 레코드 생성)
  async joinRoom(userId: string, roomId: string): Promise<UserRoom> {
    const ur = this.urRepo.create({ userId, roomId });
    return this.urRepo.save(ur);
  }

  // 3) 메시지 저장
  async saveMessage(dto: {
    roomId: string;
    senderId: string;
    content: string;
    type?: string;
  }): Promise<Message> {
    const msg = this.msgRepo.create({
      roomId: dto.roomId,
      senderId: dto.senderId,
      content: dto.content,
      type: (dto.type as 'TEXT' | 'IMAGE' | 'FILE') ?? 'TEXT',
    });
    return this.msgRepo.save(msg);
  }

  // 4) 방 내 대화 이력 조회 (페이징)
  async getHistory(roomId: string, page = 1, limit = 20): Promise<Message[]> {
    return this.msgRepo.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // 5) 방 나가기
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    await this.urRepo.delete({ userId, roomId });
  }

  async getAllRooms(): Promise<Room[]> {
    return this.roomRepo.find({
      order: { lastMessageAt: 'DESC' }, // 최신 순으로 정렬
    });
  }

  async getRoomsForUser(userId: string): Promise<Room[]> {
    // 1. user_room 테이블에서 해당 유저가 속한 모든 방의 정보를 찾습니다.
    // 2. 'room' 관계를 함께 로드하여 각 방의 상세 정보(이름 등)를 가져옵니다.
    const userRooms = await this.userRoomRepo.find({
      where: { userId },
      relations: ['room'], // 'room' 관계를 함께 로드
    });

    // 3. UserRoom 엔티티 배열에서 Room 엔티티만 추출하여 반환합니다.
    return userRooms.map((userRoom) => userRoom.room);
  }

  async getOrCreatePrivateRoom(
    user1Id: string,
    user2Id: string,
  ): Promise<Room> {
    // 두 사용자의 ID를 정렬하여 항상 동일한 순서를 보장합니다.
    const sortedUserIds = [user1Id, user2Id].sort();
    // 정렬된 ID를 기반으로 고유한 방 ID를 생성합니다.
    const privateRoomId = `private-${sortedUserIds[0]}-${sortedUserIds[1]}`;

    // 1. 해당 ID를 가진 방이 이미 존재하는지 확인합니다.
    let room = await this.roomRepo.findOneBy({ id: privateRoomId });

    // 2. 방이 존재하지 않으면 새로 생성합니다.
    if (!room) {
      // 새로운 PRIVATE 타입의 방을 생성합니다. (이름은 없음)
      room = this.roomRepo.create({
        id: privateRoomId,
        type: 'PRIVATE',
      });
      await this.roomRepo.save(room);

      // 두 사용자를 모두 이 방에 참여시킵니다.
      await this.joinRoom(user1Id, privateRoomId);
      await this.joinRoom(user2Id, privateRoomId);
    }

    // 3. 기존 방 또는 새로 생성된 방을 반환합니다.
    return room;
  }
}
