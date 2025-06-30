import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SaveVideoMetaDto {
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  parent_video_id?: number;

  @IsNumber()
  depth: number;

  @IsString()
  source_video_url: string;

  @IsString()
  results_video_url: string;

  @IsString()
  thumbnail_url: string;
}
