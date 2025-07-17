// src/likes/dto/likes.dto.ts

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum CONTENT_TYPE {
  VINYL = 'vinyl',
  COMMUNITY = 'community',
  COMMENT = 'comment',
}

export class ToggleLikeDto {
  @IsEnum(CONTENT_TYPE)
  @IsNotEmpty()
  contentType: CONTENT_TYPE;

  // contentType에 따라 postId의 유효성 검사를 다르게 적용할 수 있습니다.
  // 여기서는 간단히 string 또는 number 타입인지 확인합니다.
  @ValidateIf((o: ToggleLikeDto) => typeof o.postId === 'string')
  @IsString()
  @ValidateIf((o: ToggleLikeDto) => typeof o.postId === 'number')
  @IsNumber()
  @IsNotEmpty()
  postId: number | string;
}
