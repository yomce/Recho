import { Body, Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { EnsembleService } from './ensemble.service';
import { PaginationQueryEnsembleDto } from './dto/pagination-query-ensemble.dto';
import { PaginatedEnsembleResponse } from './dto/paginated-ensemble.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';

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
  ): Promise<RecruitEnsemble> {
    this.logger.log(`Enrolling a new post: ${createRecruitEnsembleDto.title}`);
    return await this.ensembleService.enrollEnsemble(createRecruitEnsembleDto);
  }
}
