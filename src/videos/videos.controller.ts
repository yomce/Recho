import { Controller, Get, Param, Patch, Body } from "@nestjs/common";
import { VideosService } from "./videos.service";
import { UpdateVideoDto } from "./dto/update-video.dto";

@Controller("videos")
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.videosService.findOne(id);
  }

  @Get(":id/lineage")
  findVideoLineage(@Param("id") id: string) {
    return this.videosService.findVideoLineage(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }
}
