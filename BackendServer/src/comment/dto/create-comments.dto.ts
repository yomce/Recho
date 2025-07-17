// src/comments/dto/create-comment.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CONTENT_TYPE } from '../../likes/dto/toggle-like.dto'; // Re-using the same enum

export class CreateCommentDto {
  @IsEnum(CONTENT_TYPE)
  @IsNotEmpty()
  contentType: CONTENT_TYPE;

  // Validate postId based on its type, just like in ToggleLikeDto
  @ValidateIf((o: CreateCommentDto) => typeof o.postId === 'string')
  @IsString()
  @ValidateIf((o: CreateCommentDto) => typeof o.postId === 'number')
  @IsNumber()
  @IsNotEmpty()
  postId: number | string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}
