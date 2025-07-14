import { IsString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReferenceIn } from '../types/image.types';

// --- 단일 요청
export class ImageGetPresignedUrlDto {
  @IsIn(['USED-PRODUCTS', 'PRACTICE-ROOM', 'ENSEMBLES', 'USERS'])
  refIn: ReferenceIn;

  @IsString()
  fileType: string;
}

// --- 벌크 요청
export class BulkImageGetPresignedUrlDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageGetPresignedUrlDto)
  items: ImageGetPresignedUrlDto[]
}