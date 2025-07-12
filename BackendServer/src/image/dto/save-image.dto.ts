/**
 * presigned URL로 업로드 후 서버에 이미지 메타 정보를 저장합니다
 */

import { IsString, IsOptional, IsNumber, IsIn, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ReferenceIn } from "../types/image.types";

export class SaveImageDto {
  @IsString()
  imageUrl: string;

  /**
   * 	S3에서 업로드·삭제·추적에 사용할 내부 경로
   */
  @IsString()
  key: string;

  @IsIn(['USED-PRODUCTS', 'PRACTICE-ROOM', 'ENSEMBLES', 'USERS'])
  refIn: ReferenceIn;

  @IsOptional()
  @IsNumber()
  refPostid?: number;

  @IsOptional()
  @IsNumber()
  uploadOrder?: number;
}

export class BulkSaveImageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveImageDto)
  images: SaveImageDto[];
}