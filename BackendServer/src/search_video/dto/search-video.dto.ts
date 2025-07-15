import { IsString, IsOptional } from 'class-validator';

export class VideoPreviewDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  videoUrl: string;

  @IsString()
  @IsOptional()
  thumbnailUrl: string;
}