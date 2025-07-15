import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../videos/entities/video.entity';
import { SearchVideoPreview } from './entities/search-video.entity';
import { VideoPreviewDto } from './dto/search-video.dto';
import { CreateVideoPreviewDto } from './dto/create-video-preview.dto';

@Injectable()
export class SearchVideoService {
  constructor (
    @InjectRepository(Video)
    private readonly searchVideoRepository: Repository<Video>,

    @InjectRepository(SearchVideoPreview)
    private readonly videoPreviewRepository: Repository<SearchVideoPreview>,
  ) {}

  async getMyVideos (userId: string): Promise<VideoPreviewDto[]> {
    const videos = await this.searchVideoRepository.find({
      where: { user: { id : userId }},
      order: { created_at: 'DESC' },
    });

    return videos.map((video) => ({
      id: video.id,
      videoUrl: video.results_video_key.replace(/^results_video\//, ''),
      thumbnailUrl: video.thumbnail_key,
    }));
  }

  async createVideoPreview(dto: CreateVideoPreviewDto): Promise<SearchVideoPreview> {
    const entity = this.videoPreviewRepository.create({
      refIn: dto.refIn,
      refPostId: dto.refPostId || null,
      video_id: dto.videoId,
    });

    return this.videoPreviewRepository.save(entity);
  }

  async findVideoByRef(refIn: string, refPostId: number): Promise<any | null> {
    const preview = await this.videoPreviewRepository.findOne({
      where: { refIn, refPostId },
      relations: ['video'],
    });

    if (!preview || !preview.video) return null;

    return {
      id: preview.id,
      refIn: preview.refIn,
      refPostId: preview.refPostId,
      video_id: preview.video.id,
      videoUrl: preview.video.results_video_key.replace(/^results_video\//, ''),
      thumbnailUrl: preview.video.thumbnail_key,
      createdAt: preview.createdAt,
    };
  }
}