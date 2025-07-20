import { Expose, Type } from 'class-transformer';
import { UserRoomResponseDto } from './userRoom.response.dto';
import { Room } from '../entities/room.entity';

export class RoomResponseDto {
  @Expose()
  id: string;

  @Expose()
  name?: string;

  @Expose()
  type: 'PRIVATE' | 'GROUP';

  @Expose()
  createdAt: Date;

  @Expose()
  lastMessageAt: Date;

  @Expose()
  @Type(() => UserRoomResponseDto)
  userRooms: UserRoomResponseDto[];
  room: any;

  static from(entity: Room): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type;
    dto.createdAt = entity.createdAt;
    dto.lastMessageAt = entity.lastMessageAt;
    dto.userRooms =
      entity.userRooms?.map((userRoom) => UserRoomResponseDto.from(userRoom)) ??
      [];
    return dto;
  }
}
