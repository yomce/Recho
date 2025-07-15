// src/likes/likes.controller.ts (토글만 남긴 버전)
import {
  Controller,
  Post, // POST는 토글에 사용
  Get, // 조회에 사용
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateLikeDto } from './dto/like.dto';
import { CONTENT_TYPE } from './entities/like.entity';

@Controller('likes')
@UseGuards(AuthGuard('jwt')) // 컨트롤러 레벨에서 JWT 가드를 적용하여 모든 엔드포인트에 인증 요구
export class LikesController {
  constructor(private readonly likesService: LikesService) {}
  private readonly logger = new Logger(LikesController.name);

  // 사용자 ID를 안전하게 가져오는 헬퍼 함수
  private getUserId(req: Request): string {
    const userId = req.user?.id;
    if (!userId) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    return userId;
  }

  /**
   * 좋아요 토글 (누르지 않았다면 추가, 눌렀다면 취소)
   * @param req 요청 객체 (user.id가 담겨 있다고 가정)
   * @param createLikeDto 좋아요 대상 정보 (contentType, postId)
   * @returns 토글 후 좋아요 상태 { liked: boolean }
   */
  @Post() // POST /likes/toggle
  @HttpCode(HttpStatus.OK) // 200 OK
  async toggle(@Req() req: Request, @Body() createLikeDto: CreateLikeDto) {
    const userId = this.getUserId(req);
    const isLiked = await this.likesService.toggleLike(userId, createLikeDto);
    return { liked: isLiked };
  }

  /**
   * 특정 콘텐츠의 좋아요 수 조회 (인증 필요 없음)
   * @param contentType 콘텐츠 타입
   * @param contentId 콘텐츠 ID
   * @returns 좋아요 수 객체 { count: number }
   */
  @Get(':contentType/:contentId/count')
  @UseGuards() // 인증 가드를 비활성화 (모두 접근 가능)
  async getCount(
    @Param('contentType') contentType: CONTENT_TYPE,
    @Param('contentId') contentId: number,
  ) {
    const count = await this.likesService.getLikesCount(contentType, contentId);
    return { count };
  }

  /**
   * 특정 사용자가 특정 콘텐츠에 좋아요를 눌렀는지 확인 (인증 필수)
   * @param req 요청 객체 (user.id가 담겨 있다고 가정)
   * @param contentType 콘텐츠 타입
   * @param contentId 콘텐츠 ID
   * @returns 좋아요 여부 객체 { liked: boolean }
   */
  @Get(':contentType/:contentId/status')
  async getStatus(
    @Req() req: Request,
    @Param('contentType') contentType: CONTENT_TYPE,
    @Param('contentId') contentId: number,
  ) {
    const userId = this.getUserId(req); // 인증 필요
    const liked = await this.likesService.hasUserLiked(
      userId,
      contentType,
      contentId,
    );
    return { liked };
  }
}
