import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SaveVideoMetaDto {
  @IsNumber()
  user_id: number;

  @IsString()
  video_key: string;

  @IsString()
  thumbnail_key: string;

  @IsOptional()
  @IsNumber()
  parent_video_id?: number;

  @IsOptional()
  @IsNumber()
  depth?: number;
}