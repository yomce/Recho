// src/chat/chat.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './entities/room.entity';
import { UserRoom } from './entities/user-room.entity';
import { Message } from './entities/message.entity';
import { RoomType } from './dto/create-room.dto';
import { UserMessageRead } from './entities/user-message-read.entity'; // 추가
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { UserRoomResponseDto } from './dto/userRoom.response.dto';
import { ImageService } from 'src/image/image.service';
import { RoomResponseDto } from './dto/room.response.dto';
import { MessageResponseDto } from './dto/message.response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(UserRoom) private urRepo: Repository<UserRoom>,
    @InjectRepository(UserRoom) private userRoomRepo: Repository<UserRoom>,
    @InjectRepository(UserMessageRead)
    private readRepo: Repository<UserMessageRead>, // 추가

    private imageService: ImageService,
  ) {}

  // ... createRoom ...
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
    if (creatorId) {
      await this.joinRoom(creatorId, savedRoom.id);
    }
    return savedRoom;
  }

  // 2) 방 참여 (UserRoom 레코드 생성)
  async joinRoom(id: string, roomId: string): Promise<UserRoom> {
    const ur = this.userRoomRepo.create({ id, roomId });
    return this.userRoomRepo.save(ur);
  }

  // 3) 메시지 저장
  // ... saveMessage ...
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

  // 4) 방 내 대화 이력 조회 (페이징) - 수정된 함수
  // ... getHistory ...
  async getHistory(
    roomId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<MessageResponseDto[]> {
    const userRoom = await this.userRoomRepo.findOneBy({ roomId, id: userId });
    if (!userRoom) {
      throw new ForbiddenException('You are not a member of this room.');
    }
    await this.markAsRead(roomId, userId);
    const messages = await this.msgRepo.find({
      where: {
        roomId,
        createdAt: MoreThan(userRoom.joinedAt),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender'],
    });

    return await Promise.all(
      messages.map(async (msg) => {
        const tmpUserResDto = UserResponseDto.from(msg.sender);
        if (msg.sender?.profileUrl) {
          tmpUserResDto.profileImageUrl =
            await this.imageService.getDownloadUrl(msg.sender.profileUrl);
        }
        const tmpMsgDto = new MessageResponseDto();
        tmpMsgDto.id = msg.id;
        tmpMsgDto.roomId = msg.roomId;
        tmpMsgDto.senderId = msg.senderId;
        tmpMsgDto.type = msg.type;
        tmpMsgDto.content = msg.content;
        tmpMsgDto.createdAt = msg.createdAt;
        tmpMsgDto.readAt = msg.readAt;
        tmpMsgDto.sender = tmpUserResDto;
        return tmpMsgDto;
      }),
    );
  }

  // 5) 방 나가기
  async leaveRoom(id: string, roomId: string): Promise<void> {
    // 1. 사용자를 방에서 내보냅니다 (UserRoom 레코드 삭제).
    await this.userRoomRepo.delete({ id, roomId });
    this.logger.log(`User ${id} left room ${roomId}`);

    // 2. 방에 남은 인원 수를 확인합니다.
    const remainingCount = await this.urRepo.count({ where: { roomId } });
    this.logger.log(`Room ${roomId} has ${remainingCount} users remaining.`);

    // 3. 남은 인원이 0명이라면 방과 관련된 모든 데이터를 삭제합니다.
    if (remainingCount === 0) {
      this.logger.log(
        `Room ${roomId} is empty. Deleting room and all related data...`,
      );
      // Room을 삭제하면 CASCADE 옵션에 의해 Message, UserRoom 데이터도 함께 삭제됩니다.
      await this.roomRepo.delete(roomId);
      this.logger.log(`Room ${roomId} has been successfully deleted.`);
    }
  }

  async getAllRooms(): Promise<Room[]> {
    return this.roomRepo.find({
      order: { lastMessageAt: 'DESC' }, // 최신 순으로 정렬
    });
  }

  async getRoomsForUser(userId: string): Promise<any[]> {
    // 반환 타입 수정
    const userRooms = await this.userRoomRepo.find({
      where: { id: userId },
      relations: ['room', 'room.userRooms', 'room.userRooms.user'],
      order: { room: { lastMessageAt: 'DESC' } },
    });

    if (userRooms.length === 0) return [];

    // 2. 가져온 userRooms 배열을 순회하며 최종적인 RoomResponseDto 배열을 만듭니다.
    const finalUserRoomDtos = await Promise.all(
      userRooms.map(async (userRoom) => {
        const roomEntity = userRoom.room;

        // 3. 최상위 RoomResponseDto를 수동으로 생성합니다.
        const roomDto = new RoomResponseDto();
        roomDto.id = roomEntity.id;
        roomDto.name = roomEntity.name;
        roomDto.type = roomEntity.type;
        roomDto.createdAt = roomEntity.createdAt;
        roomDto.lastMessageAt = roomEntity.lastMessageAt;

        // 4. 해당 채팅방에 참여한 유저들의 DTO를 만듭니다.
        roomDto.userRooms = await Promise.all(
          roomEntity.userRooms.map(async (participant) => {
            // 중첩된 UserRoomResponseDto를 수동으로 생성합니다.
            const participantDto = new UserRoomResponseDto();
            participantDto.id = participant.id;
            participantDto.roomId = participant.roomId;
            participantDto.joinedAt = participant.joinedAt;

            // User DTO는 순환 참조 문제가 없으므로 기존 from 메소드를 사용해도 괜찮습니다.
            const userDto = UserResponseDto.from(participant.user);
            // 유저 프로필 이미지의 Signed URL을 추가합니다.
            if (participant.user?.profileUrl) {
              userDto.profileImageUrl = await this.imageService.getDownloadUrl(
                participant.user.profileUrl,
              );
            } else {
              userDto.profileImageUrl = null;
            }
            participantDto.user = userDto;

            // 중요: 최종 DTO(JSON) 응답에서 순환 참조가 발생하지 않도록
            // `participantDto.room`은 설정하지 않습니다. (기본값: undefined)
            return participantDto;
          }),
        );

        const finalUserRoomDto = new UserRoomResponseDto();
        finalUserRoomDto.id = userRoom.id;
        finalUserRoomDto.roomId = userRoom.roomId;
        finalUserRoomDto.joinedAt = userRoom.joinedAt;
        finalUserRoomDto.room = roomDto;

        return finalUserRoomDto;
      }),
    );

    const roomIds = userRooms.map((ur) => ur.roomId);

    // ✨ (오류 수정) getRawMany()의 결과 타입을 명시해줍니다.
    interface UnreadCountResult {
      roomId: string;
      unreadCount: string; // COUNT 결과는 문자열로 반환됩니다.
    }

    // 각 방의 안 읽은 메시지 수를 한 번의 쿼리로 가져옵니다.
    const unreadCounts = await this.msgRepo
      .createQueryBuilder('message')
      .leftJoin(
        UserMessageRead,
        'read',
        'read.messageId = message.id AND read.userId = :userId',
        { userId },
      )
      .where('message.roomId IN (:...roomIds)', { roomIds })
      .andWhere('message.senderId != :userId', { userId }) // 내가 보낸 메시지는 제외
      .andWhere('read.userId IS NULL')
      .select('message.roomId', 'roomId')
      .addSelect('COUNT(message.id)', 'unreadCount')
      .groupBy('message.roomId')
      .getRawMany<UnreadCountResult>();

    // lint 경고 해결 및 가독성 향상
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.roomId, parseInt(item.unreadCount, 10)]),
    );

    return finalUserRoomDtos.map((userRoom) => ({
      ...userRoom.room,
      unreadCount: unreadCountMap.get(userRoom.roomId) || 0,
    }));
  }

  // (신규) 특정 방의 메시지 읽음 처리 메서드
  async markAsRead(roomId: string, userId: string): Promise<void> {
    interface UnreadMessageId {
      id: string;
    }
    // 1. 해당 방에서 내가 보내지 않고 아직 읽지 않은 모든 메시지 ID를 찾습니다.
    const unreadMessages = await this.msgRepo
      .createQueryBuilder('message')
      .leftJoin(
        UserMessageRead,
        'read',
        'read.messageId = message.id AND read.userId = :userId',
        { userId },
      )
      .where('message.roomId = :roomId', { roomId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('read.userId IS NULL')
      .select('message.id', 'id')
      .getRawMany<UnreadMessageId>();

    const messageIdsToRead = unreadMessages.map((m) => m.id);

    if (messageIdsToRead.length === 0) return;

    // 2. 찾아낸 메시지 ID들을 UserMessageRead 테이블에 한 번에 삽입합니다.
    const readRecords = messageIdsToRead.map((messageId) => ({
      userId,
      messageId,
      readAt: new Date(),
    }));

    await this.readRepo.upsert(readRecords, ['userId', 'messageId']);
  }

  // (신규) 전체 안 읽은 메시지 수 조회
  async getTotalUnreadCount(userId: string): Promise<number> {
    return this.msgRepo
      .createQueryBuilder('message')
      .leftJoin(
        UserMessageRead,
        'read',
        'read.messageId = message.id AND read.userId = :userId',
        { userId },
      )
      .leftJoin(
        UserRoom,
        'ur',
        'ur.roomId = message.roomId AND ur.id = :userId',
        { userId },
      )
      .where('ur.id IS NOT NULL') // 내가 참여한 방의 메시지만 카운트
      .andWhere('message.senderId != :userId', { userId }) // 내가 보낸 메시지는 제외
      .andWhere('read.userId IS NULL')
      .getCount();
  }

  async getOrCreatePrivateRoom(
    user1Id: string,
    user2Id: string,
  ): Promise<Room> {
    const sortedids = [user1Id, user2Id].sort();
    const privateRoomId = `private-${sortedids[0]}-${sortedids[1]}`;

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
      const user1InRoom = await this.userRoomRepo.findOneBy({
        id: user1Id,
        roomId: room.id,
      });
      if (!user1InRoom) {
        await this.joinRoom(user1Id, room.id);
      }

      // user2가 방에 참여해있는지 확인
      const user2InRoom = await this.userRoomRepo.findOneBy({
        id: user2Id,
        roomId: room.id,
      });
      if (!user2InRoom) {
        await this.joinRoom(user2Id, room.id);
      }
    }

    return room;
  }

  async findRoomById(roomId: string, userId: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      // 이 방에 속한 사용자들의 정보를 함께 가져옵니다.
      relations: ['userRooms', 'userRooms.user'],
    });

    // 1. 방이 존재하지 않을 경우
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found.`);
    }

    // 2. 방에 참여한 사용자 목록에 요청한 사용자가 없는 경우
    const isUserInRoom = room.userRooms.some(
      (userRoom) => userRoom.user.id === userId,
    );
    if (!isUserInRoom) {
      throw new ForbiddenException(
        'You do not have permission to access this room.',
      );
    }

    return room;
  }
}
