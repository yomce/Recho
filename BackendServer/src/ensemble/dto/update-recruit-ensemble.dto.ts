import { PartialType } from '@nestjs/mapped-types';
import { CreateRecruitEnsembleDto } from './create-recruit-ensemble.dto';

export class UpdateRecruitEnsembleDto extends PartialType(
  CreateRecruitEnsembleDto,
) {}
