// src/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaginationQueryPostDto } from './dto/pagination-query-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}
  private readonly logger = new Logger(PostsController.name);

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ): Promise<PostEntity> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Query() paginationQuery: PaginationQueryPostDto,
    @Query('category') category: string,
    @Req() req: Request,
  ) {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    return this.postsService.findAllPostsWithDetails(
      category,
      req.user,
      paginationQuery,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<PostEntity> {
    return this.postsService.findOne(id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.remove(id, req.user);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'))
  async getMyPosts(@Req() req: Request): Promise<any[]> {
    const userId = (req.user as any).id;
    return this.postsService.findPostsByUser(userId);
  }

}
