import { IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateLocationDto {
  @IsString()
  place_name: string;

  @IsString()
  address: string;

  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;

  @IsString()
  region_level1: string;

  @IsString()
  region_level2: string;

  @IsString()
  region_level3: string;
}