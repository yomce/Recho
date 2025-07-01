import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EnsembleService } from './ensemble.service';
import { PaginationQueryEnsembleDto } from './dto/pagination-query-ensemble.dto';
import { PaginatedEnsembleResponse } from './dto/paginated-ensemble.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { Request } from 'express';

@Controller('ensembles')
export class EnsembleController {
  constructor(private readonly ensembleService: EnsembleService) {}
  private readonly logger = new Logger(EnsembleController.name);

  @Get()
  async getEnsemble(
    @Query() paginationQuery: PaginationQueryEnsembleDto,
  ): Promise<PaginatedEnsembleResponse> {
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
  async detailProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecruitEnsemble> {
    this.logger.log(`Fetching detail for product ID: ${id}`);
    return await this.ensembleService.detailProduct(id);
  }
}
