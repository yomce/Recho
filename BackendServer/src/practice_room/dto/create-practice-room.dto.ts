import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePracticeRoomDto {
  @IsNumber()
  @IsNotEmpty()
  post_id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  user_name: string;

  @IsString()
  @IsOptional()
  iamges?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  locationId: number;
}
