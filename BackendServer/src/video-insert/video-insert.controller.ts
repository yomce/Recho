import { Controller, Post, Body } from '@nestjs/common';
import { VideoInsertService } from './video-insert.service';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';

// Presigned URL의 목적을 정의하는 타입
export type TFilePurpose = 'RESULT_VIDEO' | 'THUMBNAIL' | 'SOURCE_VIDEO';

// Presigned URL 요청용 DTO
export class GetUploadUrlDto {
  // `fileType`은 이제 각 purpose별로 필요 

  purposes: {
    purpose: TFilePurpose;
    fileType: string;
  }[];
}

@Controller('video-insert')
export class VideoInsertController {
  constructor(private readonly videoInsertService: VideoInsertService) {}

  // 1. Pre-signed URL 생성 요청을 처리하는 엔드포인트 (POST)
  @Post('upload-urls')
  async getUploadUrls(@Body() getUploadUrlDto: GetUploadUrlDto) {
    // 서비스 함수에 DTO 객체 전체를 전달하도록 수정
    return await this.videoInsertService.getUploadUrls(getUploadUrlDto);
  }

  // 2. S3 업로드 완료 후 DB에 영상 메타데이터 저장 (POST)
  @Post('complete')
  saveFinalVideoMeta(@Body() saveVideoMetaDto: SaveVideoMetaDto) {
    return this.videoInsertService.saveFinalVideoMeta(saveVideoMetaDto);
  }
}
