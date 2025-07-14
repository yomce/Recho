import { IsArray, IsNumber } from "class-validator";

export class DeleteImageDto {
  @IsArray()
  @IsNumber({}, { each: true })
  imageIds: number[];
}