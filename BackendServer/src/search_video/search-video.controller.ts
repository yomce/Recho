import { Controller, Get, Req, UseGuards, Query, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchVideoService } from './search-video.service';
import { CreateVideoPreviewDto } from './dto/create-video-preview.dto';


@Controller('search-video')
export class SearchVideoController {
  constructor (private readonly searchVideoService: SearchVideoService) {}

  // 1. [GET] 내 영상 목록 조회
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getMyVideos(@Req() req) {
    const id = req.user.id;
    return this.searchVideoService.getMyVideos(id);
  }

  // 2. [POST] 게시글과 영상 매핑 등록
  @Post('preview')
  async createVideoPreview(@Body() dto: CreateVideoPreviewDto) {
    return this.searchVideoService.createVideoPreview(dto);
  }

  // 3. [GET] 게시글 기준으로 매핑된 영상 조회
  @Get('preview')
  async findVideoPreviewByRef(
    @Query('refIn') refIn: string,
    @Query('refPostId') refPostId: number,
  ) {
    return this.searchVideoService.findVideoByRef(refIn, refPostId);
  }
}