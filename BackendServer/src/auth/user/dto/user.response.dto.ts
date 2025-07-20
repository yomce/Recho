import { Expose } from 'class-transformer';
import { User } from '../user.entity';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  intro: string | null;

  @Expose()
  createdAt: string;

  // S3의 파일 키가 아닌, 완전한 이미지 URL을 담을 필드입니다.
  @Expose()
  profileImageUrl: string | null;

  static from(user: User, profileImageUrl?: string) {
    const newUser = new UserResponseDto();

    newUser.id = user.id;
    newUser.username = user.username;
    newUser.intro = user.intro;
    newUser.createdAt = user.createdAt.toString();
    if (profileImageUrl) {
      newUser.profileImageUrl = profileImageUrl;
    } else {
      newUser.profileImageUrl = null;
    }

    return newUser;
  }
}
