import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SaveVideoMetaDto {
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsString()
  source_video_url: string;

  @IsOptional()
  @IsString()
  results_video_url?: string;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsNumber()
  parent_video_id?: number;

  @IsOptional()
  @IsNumber()
  depth?: number;
}
