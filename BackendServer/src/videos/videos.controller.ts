// src/videos/videos.controller.ts

import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Req,
  Logger,
  Patch,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}
  private readonly logger = new Logger(VideosController.name);

  @Get('thumbnails')
  async getThumbnails(@Query('id') id: string) {
    if (!id) {
      throw new NotFoundException('User not found');
    }
    return this.videosService.getThumbnailsByUser(id);
  }

  @Get('user/:id')
  async getVideoByUser(@Param('id') id: string) {
    if (!id) {
      throw new NotFoundException('User not found');
    }
    return this.videosService.getVideosByUser(id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getVideos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: 'likes' | 'createdAt' = 'createdAt',
    @Req() req: Request,
  ) {
    return this.videosService.getVideos(page, limit, sortBy, req.user);
  }

  @Get('source')
  async getSourceVideoUrl(@Query('videoKey') videoKey: string) {
    if (!videoKey) {
      throw new NotFoundException('Video key is required');
    }
    return this.videosService.getSourceVideoUrl(videoKey);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.videosService.getVideoDetails(id, req.user);
  }

  @Get(':id/lineage')
  findVideoLineage(@Param('id') id: string) {
    return this.videosService.findVideoLineage(id);
  }

  @Patch(':id/deactivate') // 특정 ID의 비디오를 비활성화하는 PATCH 엔드포인트
  @HttpCode(HttpStatus.OK) // 성공 시 200 OK 상태 코드 반환
  @UseGuards(AuthGuard('jwt')) // JWT 인증 가드 적용 (인증된 사용자만 접근 가능)
  async deactivateVideo(
    @Param('id') id: string,
    @Req() req: Request, // 인증된 사용자 정보는 req.user에 담겨있다고 가정
  ) {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }

    const user = req.user;
    return this.videosService.deactivateVideo(id, user);
  }
}
