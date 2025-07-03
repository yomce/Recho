import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';


import { Room } from './entities/room.entity'
import { UserRoom } from './entities/user-room.entity'
import { Message } from './entities/message.entity'
import { RoomType } from './dto/create-room.dto';


// src/chat/chat.service.ts
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);


  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(UserRoom) private urRepo: Repository<UserRoom>,
    @InjectRepository(UserRoom) private userRoomRepo: Repository<UserRoom>,
  ) {}

  async createRoom(name: string, type: RoomType, creatorId?: string): Promise<Room> {
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
  async saveMessage(dto: { roomId: string; senderId: string; content: string; type?: string; }): Promise<Message> {
    const msg = this.msgRepo.create({
      roomId: dto.roomId,
      senderId: dto.senderId,
      content: dto.content,
      type: (dto.type as 'TEXT' | 'IMAGE' | 'FILE') ?? 'TEXT',
    });
    return this.msgRepo.save(msg);
  }

  // 4) 방 내 대화 이력 조회 (페이징) - 수정된 함수
  async getHistory(roomId: string, userId: string, page = 1, limit = 20): Promise<Message[]> {
    // 1. 현재 사용자가 이 방에 참여한 정보를 찾습니다.
    const userRoom = await this.userRoomRepo.findOneBy({ roomId, userId });

    // 2. 만약 어떤 이유로든 참여 정보가 없다면, 빈 배열을 반환합니다.
    if (!userRoom) {
      return [];
    }

    // 3. 사용자의 참여 시간(joinedAt) 이후에 생성된 메시지만 조회합니다.
    return this.msgRepo.find({
      where: {
        roomId,
        createdAt: MoreThan(userRoom.joinedAt), // [수정] 사용자의 참여 시간보다 최신인 메시지만 필터링
      },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender'], // [추가] 메시지 보낸 사람의 정보를 함께 가져오도록 설정
    });
  }

  // 5) 방 나가기
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    // 1. 사용자를 방에서 내보냅니다 (UserRoom 레코드 삭제).
    await this.urRepo.delete({ userId, roomId });
    this.logger.log(`User ${userId} left room ${roomId}`);

    // 2. 방에 남은 인원 수를 확인합니다.
    const remainingCount = await this.urRepo.count({ where: { roomId } });
    this.logger.log(`Room ${roomId} has ${remainingCount} users remaining.`);

    // 3. 남은 인원이 0명이라면 방과 관련된 모든 데이터를 삭제합니다.
    if (remainingCount === 0) {
      this.logger.log(`Room ${roomId} is empty. Deleting room and all related data...`);
      // Room을 삭제하면 CASCADE 옵션에 의해 Message, UserRoom 데이터도 함께 삭제됩니다.
      await this.roomRepo.delete(roomId);
      this.logger.log(`Room ${roomId} has been successfully deleted.`);
    }
  }

  async getAllRooms(): Promise<Room[]> {
    return this.roomRepo.find({
      order: { lastMessageAt: 'DESC' },  // 최신 순으로 정렬
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
    return userRooms.map(userRoom => userRoom.room);
  }

  async getOrCreatePrivateRoom(user1Id: string, user2Id: string): Promise<Room> {
    const sortedUserIds = [user1Id, user2Id].sort();
    const privateRoomId = `private-${sortedUserIds[0]}-${sortedUserIds[1]}`;

    let room = await this.roomRepo.findOneBy({ id: privateRoomId });

    if (!room) {
      // 방이 존재하지 않으면 새로 생성
      room = this.roomRepo.create({
        id: privateRoomId,
        type: 'PRIVATE',
      });
      await this.roomRepo.save(room);

      // 두 사용자를 모두 방에 참여시킵니다.
      await this.joinRoom(user1Id, privateRoomId);
      await this.joinRoom(user2Id, privateRoomId);
    } else {
      // [수정] 방이 이미 존재할 경우, 각 사용자가 방에 참여해있는지 확인하고, 없다면 다시 참여시킵니다.
      
      // user1이 방에 참여해있는지 확인
      const user1InRoom = await this.userRoomRepo.findOneBy({ userId: user1Id, roomId: room.id });
      if (!user1InRoom) {
        await this.joinRoom(user1Id, room.id);
      }

      // user2가 방에 참여해있는지 확인
      const user2InRoom = await this.userRoomRepo.findOneBy({ userId: user2Id, roomId: room.id });
      if (!user2InRoom) {
        await this.joinRoom(user2Id, room.id);
      }
    }

    return room;
  }
}
