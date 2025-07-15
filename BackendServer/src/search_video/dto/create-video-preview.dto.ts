// src/video_preview/dto/create-video-preview.dto.ts
import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateVideoPreviewDto {
  @IsString()
  refIn: string;

  @IsInt()
  @IsOptional()
  refPostId?: number;

  @IsUUID()
  videoId: string;
}