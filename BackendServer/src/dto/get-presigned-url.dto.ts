import { IsString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 클라이언트가 요청할 파일의 목적을 명시
// - RESULT_VIDEO: 최종적으로 인코딩된 결과 영상
// - THUMBNAIL: 결과 영상에서 추출된 썸네일 이미지
// - SOURCE_VIDEO: 편집에 사용된 원본 영상
export type TFilePurpose = 'RESULT_VIDEO' | 'THUMBNAIL' | 'SOURCE_VIDEO';
export const FilePurpose: TFilePurpose[] = [
  'RESULT_VIDEO',
  'THUMBNAIL',
  'SOURCE_VIDEO',
];

export class FileUploadInfoDto {
  @IsString()
  fileType: string;

  @IsIn(FilePurpose)
  purpose: TFilePurpose;
}

export class GetUploadUrlDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadInfoDto)
  files: FileUploadInfoDto[];
}
