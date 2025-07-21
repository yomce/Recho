import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ImageService } from './image.service';
import {
  BulkImageGetPresignedUrlDto,
  ImageGetPresignedUrlDto,
} from './dto/image-get-presigned-url.dto';
import { ReferenceIn, UploadInfo } from './types/image.types';
import { BulkSaveImageDto } from './dto/save-image.dto';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get('download/:key') // GET /images/download/:key
  async getDownloadUrl(@Param('key') key: string) {
    const url = await this.imageService.getDownloadUrl(key);
    return url;
  }

  @Post('upload-urls')
  async getPresignedUrls(
    @Body() dto: ImageGetPresignedUrlDto | BulkImageGetPresignedUrlDto,
  ): Promise<Record<ReferenceIn, UploadInfo>> {
    return await this.imageService.getPresignedUrl(dto);
  }

  @Post()
  async saveImages(
    @Body() bulkImageSave: BulkSaveImageDto,
  ): Promise<{ imageIds: number[] }> {
    const savedImages = await this.imageService.saveImages(
      bulkImageSave.images,
    );
    console.log('👉 컨트롤러 응답 직전:', savedImages);
    return { imageIds: savedImages.map((img) => img.imageId) };
  }
}
