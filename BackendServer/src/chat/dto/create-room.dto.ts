// src/chat/dto/create-room.dto.ts
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum RoomType {
  PRIVATE = 'PRIVATE',
  GROUP   = 'GROUP',
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(RoomType)
  type: RoomType;
}
