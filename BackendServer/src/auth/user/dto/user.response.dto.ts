import { Expose } from 'class-transformer';

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
}
