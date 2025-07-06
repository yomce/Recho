import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SaveVideoMetaDto {
  @IsString()
  user_id: string;

  @IsString()
  results_video_key: string;

  @IsString()
  source_video_key: string;

  @IsString()
  thumbnail_key: string;

  @IsOptional()
  @IsString()
  parent_video_id?: string;

  @IsOptional()
  @IsNumber()
  depth?: number;
}
