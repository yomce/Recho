import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CreatePracticeRoomDto } from './dto/create-practice-room.dto';
import { UpdatePracticeRoomDto } from './dto/update-practice-room.dto';
import { PracticeRoomService } from './practice-room.service';
import { PaginationQueryPracticeRoomDto } from './dto/pagination-query-practice-room.dto';
import { PaginatedPracticeRoomResponse } from './dto/paginated-practice-room.response.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PracticeRoomResponseDto } from './dto/parctice-room.response.dto';

@Controller('practice-room')
export class PracticeRoomController {
  constructor(private readonly practiceRoomService: PracticeRoomService) {}
  private readonly logger = new Logger(PracticeRoomController.name);

  @Get()
  async getPracticeRoom(
    @Query() paginationQuery: PaginationQueryPracticeRoomDto,
  ): Promise<PaginatedPracticeRoomResponse> {
    console.log('Pagination query received:', Query);
    const { limit = 20, lastProductId, lastCreatedAt } = paginationQuery;

    return this.practiceRoomService.findPracticeRoomWithPagination(
      limit,
      lastProductId,
      lastCreatedAt,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async enrollPracticeRoom(
    @Body() CreatePracticeRoomDto: CreatePracticeRoomDto,
    @Req() req: Request,
  ): Promise<PracticeRoomResponseDto> {
    if (!req.user || !req.user.id) {
      this.logger.log(
        `Enrolling a new practice room: ${CreatePracticeRoomDto.title}`,
      );
      throw new ForbiddenException('사용자 인증 정보를 찾을 수 없습니다.');
    }
    const id = req.user.id;
    return await this.practiceRoomService.enrollPracticeRoom(
      CreatePracticeRoomDto,
      id,
    );
  }

  @Get(':postId')
  async detailPracticeRoom(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<PracticeRoomResponseDto> {
    this.logger.log(`Fetching detail for post ID: ${postId}`);
    return await this.practiceRoomService.publicDetailPracticeRoom(postId);
  }

  @Delete(':postId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  async deletePracticeRoom(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const id = req.user.id;
    this.logger.log(
      `Received delete request for product ID: ${postId} from user ID: ${id}`,
    );
    await this.practiceRoomService.deletePracticeRoom(postId, id);
  }

  @Patch(':postId')
  @UseGuards(AuthGuard('jwt'))
  async pathPracticeRoom(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() UpdatePracticeRoomDto: UpdatePracticeRoomDto,
    @Req() req: Request,
  ): Promise<PracticeRoomResponseDto> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const id = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received patch request for product ID: ${postId} from user ID: ${id}`,
    );

    return this.practiceRoomService.pathPracticeRoom(postId, UpdatePracticeRoomDto, id);
  }
}
