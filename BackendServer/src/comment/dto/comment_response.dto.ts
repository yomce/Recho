import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';

export class CommentResponseDto {
  @Expose()
  commentId: number | string; // number와 string ID 모두 처리

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => UserResponseDto) // User DTO를 재사용하여 작성자 정보 포함
  user: UserResponseDto;
}
