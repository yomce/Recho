// src/likes/dto/create-like.dto.ts
import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { CONTENT_TYPE } from '../entities/like.entity';

export class CreateLikeDto {
  @IsString()
  @IsNotEmpty({ message: '콘텐츠 타입은 필수 입력값입니다.' })
  contentType: CONTENT_TYPE; // 'article', 'photo', 'video' 등 좋아요 대상의 타입

  @IsInt({ message: '콘텐츠 ID는 정수여야 합니다.' })
  @IsNotEmpty({ message: '콘텐츠 ID는 필수 입력값입니다.' })
  postId: number; // 좋아요를 누를 콘텐츠의 고유 ID
}
