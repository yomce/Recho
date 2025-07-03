import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SKILL_LEVEL } from '../entities/recruit-ensemble.entity';
import { CreateSessionEnsembleDto } from '../session/dto/create-session-ensemble.dto';
import { Type } from 'class-transformer';

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
  @Min(0)
  totalRecruitCnt: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionEnsembleDto)
  readonly sessionList: CreateSessionEnsembleDto[];
}
