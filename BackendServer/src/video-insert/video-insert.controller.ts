import { Controller, Post, Body } from '@nestjs/common';
import { VideoInsertService } from './video-insert.service';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';

// Presigned URL 요청용 DTO
export class GetUploadUrlDto {
  filename: string;
  fileType: string;
}

@Controller('video-insert')
export class VideoInsertController {
  constructor(private readonly videoInsertService: VideoInsertService) {}

  // 1. Pre-signed URL 생성 요청을 처리하는 엔드포인트 (POST)
  @Post('upload-urls')
  async getUploadUrls(@Body() getUploadUrlDto: GetUploadUrlDto) {
    return await this.videoInsertService.getUploadUrls(
      getUploadUrlDto.fileType,
    );
  }

  // 2. S3 업로드 완료 후 DB에 영상 메타데이터 저장 (POST)
  @Post('complete')
  saveFinalVideoMeta(@Body() saveVideoMetaDto: SaveVideoMetaDto) {
    return this.videoInsertService.saveFinalVideoMeta(saveVideoMetaDto);
  }
}
