import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { SKILL_LEVEL } from '../entities/recruit-ensemble.entity';

export class CreateRecruitEnsembleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDate()
  @IsNotEmpty()
  eventDate: Date;

  @IsEnum(SKILL_LEVEL)
  @IsNotEmpty()
  skillLevel: SKILL_LEVEL;

  @IsNumber()
  @IsNotEmpty()
  locationId: number;

  @IsNumber()
  @IsNotEmpty()
  instrument_category_id: number;

  @IsNumber()
  @Min(0)
  total_recruit_cnt: number;
}
