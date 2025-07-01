// src/videos/videos.controller.ts

import { Controller, Logger, Get, Query, ParseIntPipe } from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}
  private readonly logger = new Logger(VideosController.name);

  @Get('thumbnails')
  getThumbnailsByUser(@Query('userId', ParseIntPipe) userId: number) {
    return this.videosService.getThumbnailsByUser(userId);
  }

  @Get()
  getVideos(
    @Query('sortBy') sortBy: string = 'likes',
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
  ) {
    return this.videosService.getVideos(sortBy, limit, page);
  }

  @Get('source')
  getSourceVideoUrl(@Query('videoId', ParseIntPipe) videoId: number) {
    return this.videosService.getSourceVideoUrl(videoId);
  }
}
