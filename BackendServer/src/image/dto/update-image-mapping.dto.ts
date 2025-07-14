/**
 * 게시글 저장 완료 후 미리 저장된 이미지를 게시글 ID와 매핑합니다
 */

import { IsNumber, IsArray } from "class-validator";

export class UpdateImageMappingDto {
  @IsNumber()
  refPostId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  imageIds: number[];
}