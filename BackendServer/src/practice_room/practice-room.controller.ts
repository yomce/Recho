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
import { PracticeRoom } from './entities/practice-room.entity';
import { PracticeRoomService } from './practice-room.service';
import { PaginationQueryPracticeRoomDto } from './dto/pagination-query-practice-room.dto';
import { PaginatedPracticeRoomResponse } from './dto/paginated-practice-room.response.dto';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

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
  ): Promise<PracticeRoom> {
    if (!req.user || !req.user.id) {
      this.logger.log(
        `Enrolling a new practice room: ${CreatePracticeRoomDto.title}`,
      );
      throw new ForbiddenException('사용자 인증 정보를 찾을 수 없습니다.');
    }
    const userId = req.user.id;
    return await this.practiceRoomService.enrollPracticeRoom(
      CreatePracticeRoomDto,
      userId,
    );
  }

  @Get(':id')
  async detailPracticeRoom(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PracticeRoom> {
    this.logger.log(`Fetching detail for post ID: ${id}`);
    return await this.practiceRoomService.detailPracticeRoom(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePracticeRoom(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    this.logger.log(`Delete Post ID: ${id}`);
    await this.practiceRoomService.deletePracticeRoom(id);
  }

  @Patch(':id')
  async pathPracticeRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() UpdatePracticeRoomDto: UpdatePracticeRoomDto,
  ): Promise<PracticeRoom> {
    this.logger.log(`Patching Post Id: ${id}`);
    return this.practiceRoomService.pathPracticeRoom(id, UpdatePracticeRoomDto);
  }
}
