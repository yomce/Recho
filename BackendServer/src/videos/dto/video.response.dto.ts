import { User } from 'src/auth/user/user.entity';
import { Video } from '../entities';

export class VideoResponseDto {
  id: string;
  user: User;
  parent: Video;
  parentVideoId: string;
  children: Video[];
  depth: number;
  startTime: number;
  endTime: number;
  timelinePosition: number;
  resultsVideoKeys: string;
  thumbnailKey: string;
  likeCount: number;
  commentCount: number;
  createAt: Date;
  videoUrl?: string;
  thumbnailUrl?: string;

  static from(video: Video) {
    const responseDto = new VideoResponseDto();

    responseDto.id = video.id;
    responseDto.user = video.user;
    responseDto.parent = video.parent;
    responseDto.children = video.children;
    responseDto.depth = video.depth;
    responseDto.startTime = video.startTime;
    responseDto.endTime = video.endTime;
    responseDto.timelinePosition = video.timelinePosition;
    responseDto.resultsVideoKeys = video.results_video_key;
    responseDto.thumbnailKey = video.thumbnail_key;
    responseDto.likeCount = video.likeCount;
    responseDto.commentCount = video.commentCount;
    responseDto.createAt = video.created_at;
    responseDto.videoUrl = video.video_url;
    responseDto.thumbnailUrl = video.thumbnail_url;

    return responseDto;
  }
}
