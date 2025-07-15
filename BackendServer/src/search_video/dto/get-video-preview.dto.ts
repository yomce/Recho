import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';

// 방법 A - DTO 수정
export class GetVideoPreviewDto {
  @IsNumber()
  id: number;

  @IsString()
  videoUrl: string;

  @IsString()
  thumbnailUrl: string;

  @IsOptional()
  @IsString()
  refIn?: string;

  @IsOptional()
  @IsNumber()
  refPostId?: number;

  @IsOptional()
  @IsNumber()
  video_id?: string;

  @IsOptional()
  @IsDate()
  createdAt?: Date;
}
