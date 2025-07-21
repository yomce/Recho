import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../auth/user/dto/user.response.dto';
import { RoomResponseDto } from './room.response.dto';
import { UserRoom } from '../entities/user-room.entity';

export class UserRoomResponseDto {
  @Expose()
  id: string;

  @Expose()
  roomId: string;

  @Expose()
  joinedAt: Date;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  @Type(() => RoomResponseDto)
  room: RoomResponseDto;

  static from(userRoom: UserRoom): UserRoomResponseDto {
    const dto = new UserRoomResponseDto();
    dto.id = userRoom.id;
    dto.roomId = userRoom.roomId;
    dto.joinedAt = userRoom.joinedAt;
    dto.user = UserResponseDto.from(userRoom.user);
    dto.room = RoomResponseDto.from(userRoom.room);
    return dto;
  }
}
