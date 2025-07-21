import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../auth/user/dto/user.response.dto';
import { RoomResponseDto } from './room.response.dto';
import { Message } from '../entities/message.entity';

export class MessageResponseDto {
  @Expose()
  id: string;

  @Expose()
  roomId: string;

  @Expose()
  senderId: string;

  @Expose()
  type: 'TEXT' | 'IMAGE' | 'FILE';

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  readAt?: Date;

  @Expose()
  @Type(() => UserResponseDto)
  sender: UserResponseDto;

  @Expose()
  @Type(() => RoomResponseDto)
  room: RoomResponseDto;

  static from(message: Message): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = message.id;
    dto.roomId = message.roomId;
    dto.senderId = message.senderId;
    dto.type = message.type;
    dto.content = message.content;
    dto.createdAt = message.createdAt;
    dto.readAt = message.readAt;
    dto.sender = UserResponseDto.from(message.sender);
    dto.room = RoomResponseDto.from(message.room);
    return dto;
  }
}