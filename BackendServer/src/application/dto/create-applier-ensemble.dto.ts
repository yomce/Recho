import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateApplierEnsembleDto {
  @IsNumber()
  @IsNotEmpty()
  postId: number;

  @IsNumber()
  @IsNotEmpty()
  sessionId: number;
}
