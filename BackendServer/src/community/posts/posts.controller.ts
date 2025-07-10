// src/posts/posts.controller.ts
import { Controller, Get, Post, Body, Query, Param, ParseIntPipe, Delete, UseGuards, Req } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post as PostEntity } from '../entities/post.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createPostDto: CreatePostDto, @Req() req): Promise<PostEntity> {
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt')) // 비로그인 사용자도 허용하는 가드
  findAll(@Query('category') category: string, @Req() req) {
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.findAll(category, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.remove(id, req.user);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req) {
    // ⭐️ req.user 객체 전체를 서비스로 전달합니다.
    return this.postsService.toggleLike(id, req.user);
  }
}
