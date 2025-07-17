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
  findOne(@Param('id') id: string) {
    return this.videosService.getVideoDetails(id);
  }

  @Get(':id/lineage')
  findVideoLineage(@Param('id') id: string) {
    return this.videosService.findVideoLineage(id);
  }
}
