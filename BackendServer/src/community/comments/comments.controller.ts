import { Controller, Get, Post, Body, Param, ParseIntPipe, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
@UseGuards(AuthGuard('jwt')) // ⭐️ 컨트롤러 전체에 인증 가드 적용
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Req() req) {
    return this.commentsService.create(createCommentDto, req.user);
  }

  @Get('post/:postId')
  findByPostId(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPostId(postId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.commentsService.remove(id, req.user);
  }
}