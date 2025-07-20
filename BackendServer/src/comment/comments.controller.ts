// src/comments/comments.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comments.dto';
import { CONTENT_TYPE } from 'src/likes/dto/toggle-like.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  private getUserId(req: Request): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException(
        'User authentication information is missing.',
      );
    }
    return userId;
  }

  /**
   * Post a new comment. Authentication required.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Req() req: Request,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = this.getUserId(req);
    return this.commentsService.createComment(userId, createCommentDto);
  }

  /**
   * Get all comments for a piece of content. No authentication required.
   * Note: This endpoint will accept both number and string IDs.
   */
  @Get(':contentType/:postId')
  async getComments(
    @Param('contentType') contentType: CONTENT_TYPE,
    @Param('postId') postId: string,
  ) {
    // Attempt to parse postId to a number, if it fails, use it as a string.
    const parsedPostId = /^\d+$/.test(postId) ? parseInt(postId, 10) : postId;
    return this.commentsService.findCommentsByPostId(contentType, parsedPostId);
  }

  /**
   * Delete a comment. User must be the author.
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('number/:id') // Endpoint for number ID comments
  async deleteNumberComment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.getUserId(req);
    return this.commentsService.deleteComment(userId, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('string/:id') // Endpoint for string ID comments
  async deleteStringComment(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.commentsService.deleteComment(userId, id);
  }
}
