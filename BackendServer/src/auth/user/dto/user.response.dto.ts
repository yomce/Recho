import { User } from '../user.entity';

export class UserResponseDto {
  id: string;
  username: string;
  // 필요 시 추가 가능한 필드들 예시
  // nickname?: string;
  // profileImage?: string;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    // 추가 필드가 있다면 여기에 맵핑
    // dto.nickname = user.nickname;
    // dto.profileImage = user.profileImage;
    return dto;
  }
}
