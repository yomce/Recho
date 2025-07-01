import { Controller, Post, Body } from '@nestjs/common';
import { VideoInsertService } from './video-insert.service';
import { SaveVideoMetaDto } from '../dto/save-video-meta.dto';

// Presigned URL 요청용 DTO
export class GetUploadUrlDto {
  files: { fileType: string }[];
}

@Controller('video-insert')
export class VideoInsertController {
  constructor(private readonly videoInsertService: VideoInsertService) {}

  @Post('upload-urls')
  async getUploadUrls(@Body() getUploadUrlDto: GetUploadUrlDto) {
    return await this.videoInsertService.getUploadUrls(getUploadUrlDto.files);
  }

  @Post('complete')
  saveFinalVideoMeta(@Body() saveVideoMetaDto: SaveVideoMetaDto) {
    return this.videoInsertService.saveFinalVideoMeta(saveVideoMetaDto);
  }
}
