// src/entities/dto/practice-room-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { Location } from 'src/map/entities/location.entity';
import { PracticeRoom } from '../entities/practice-room.entity';

export class PracticeRoomResponseDto {
  @Expose()
  postId: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  locationId: number;

  @Expose()
  location: Location;

  @Expose()
  viewCount: number;

  static from(
    entity: PracticeRoom,
    user: UserResponseDto,
  ): PracticeRoomResponseDto {
    const dto = new PracticeRoomResponseDto();
    dto.postId = entity.postId;
    dto.user = user;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.createdAt = entity.createdAt;
    dto.locationId = entity.locationId;
    dto.location = entity.location;
    dto.viewCount = entity.viewCount;
    return dto;
  }
}
