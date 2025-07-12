import { Body, Controller, Post } from "@nestjs/common";
import { ImageService } from "./image.service";
import { BulkImageGetPresignedUrlDto, ImageGetPresignedUrlDto } from "./dto/image-get-presigned-url.dto";
import { ReferenceIn, UploadInfo } from "./types/image.types";
import { SaveImageDto, BulkSaveImageDto } from "./dto/save-image.dto";

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}
  
  @Post('upload-urls')
  async getPresignedUrls(@Body() dto: ImageGetPresignedUrlDto | BulkImageGetPresignedUrlDto) : Promise<Record<ReferenceIn, UploadInfo>> {
    return await this.imageService.getPresignedUrl(dto);
  }

  @Post()
  async saveImages(@Body() bulkImageSave: BulkSaveImageDto) : Promise<{ imageIds: number[] }> {
    const savedImages = await this.imageService.saveImages(bulkImageSave.images);
    return { imageIds: savedImages.map((img) => img.imageId) };
  }
