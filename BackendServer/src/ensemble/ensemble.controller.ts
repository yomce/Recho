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
import { EnsembleService } from './ensemble.service';
import { PaginationQueryRecruitEnsembleDto } from './dto/pagination-query-recruit-ensemble.dto';
import { PaginatedRecruitEnsembleResponse } from './dto/paginated-recruit-ensemble.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { Request } from 'express';
import { UpdateRecruitEnsembleDto } from './dto/update-recruit-ensemble.dto';

@Controller('ensembles')
export class EnsembleController {
  constructor(private readonly ensembleService: EnsembleService) {}
  private readonly logger = new Logger(EnsembleController.name);

  @Get()
  async getEnsemble(
    @Query() paginationQuery: PaginationQueryRecruitEnsembleDto,
  ): Promise<PaginatedRecruitEnsembleResponse> {
    this.logger.log('Fetching ensemble with pagination');

    const { limit = 20, lastPostId, lastCreatedAt } = paginationQuery;

    return this.ensembleService.findEnsembleWithPagination(
      limit,
      lastPostId,
      lastCreatedAt,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async enrollEnsemble(
    @Body() createRecruitEnsembleDto: CreateRecruitEnsembleDto,
    @Req() req: Request,
  ): Promise<RecruitEnsemble> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id;

    this.logger.log(`Enrolling a new post: ${createRecruitEnsembleDto.title}`);
    return await this.ensembleService.enrollEnsemble(
      createRecruitEnsembleDto,
      userId,
    );
  }

  @Get(':id')
  async detailEnsemble(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecruitEnsemble> {
    this.logger.log(`Fetching detail for product ID: ${id}`);
    return await this.ensembleService.detailEnsemble(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  async deleteEnsemble(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received delete request for product ID: ${id} from user ID: ${userId}`,
    );

    await this.ensembleService.deleteEnsemble(id, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async patchEnsemble(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecruitEnsembleDto: UpdateRecruitEnsembleDto,
    @Req() req: Request,
  ): Promise<RecruitEnsemble> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received patch request for post ID: ${id} from user ID: ${userId}`,
    );

    return this.ensembleService.patchEnsemble(
      id,
      updateRecruitEnsembleDto,
      userId,
    );
  }
}
