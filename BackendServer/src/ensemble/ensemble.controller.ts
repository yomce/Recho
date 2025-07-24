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
import { FilterRecruitEnsembleDto } from './dto/pagination-query-recruit-ensemble.dto';
import { PaginatedRecruitEnsembleResponse } from './dto/paginated-recruit-ensemble.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';
import { Request } from 'express';
import { UpdateRecruitEnsembleDto } from './dto/update-recruit-ensemble.dto';
import { RecruitEnsembleResponseDto } from './dto/recruit-ensemble.response.dto';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';

@Controller('ensembles')
export class EnsembleController {
  constructor(private readonly ensembleService: EnsembleService) {}
  private readonly logger = new Logger(EnsembleController.name);

  @Get()
  async getEnsemble(
    @Query() filter: FilterRecruitEnsembleDto,
  ): Promise<PaginatedRecruitEnsembleResponse> {
    this.logger.log('Fetching ensemble with pagination');
    
    return this.ensembleService.findEnsembleWithPagination(filter);
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
    const username = req.user.id;

    this.logger.log(`Enrolling a new post: ${createRecruitEnsembleDto.title}`);
    return await this.ensembleService.enrollEnsemble(
      createRecruitEnsembleDto,
      username,
    );
  }

  @Patch(':postId/complete')
  @UseGuards(AuthGuard('jwt'))
  async closeRecruitment(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
  ): Promise<RecruitEnsemble> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id;

    this.logger.log(
      `Closing recruitment for post ID #${postId} by user ${userId}`,
    );
    return this.ensembleService.closeRecruitment(postId, userId);
  }

  @Get(':postId')
  async detailEnsemble(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<RecruitEnsembleResponseDto> {
    this.logger.log(`Fetching detail for post ID: ${postId}`);
    return await this.ensembleService.publicDetailEnsemble(postId);
  }

  @Delete(':postId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  async deleteEnsemble(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const id = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received delete request for product ID: ${postId} from user ID: ${id}`,
    );

    await this.ensembleService.deleteEnsemble(postId, id);
  }

  @Patch(':postId')
  @UseGuards(AuthGuard('jwt'))
  async patchEnsemble(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updateRecruitEnsembleDto: UpdateRecruitEnsembleDto,
    @Req() req: Request,
  ): Promise<RecruitEnsembleResponseDto> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const id = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received patch request for post ID: ${postId} from user ID: ${id}`,
    );

    return this.ensembleService.patchEnsemble(
      postId,
      updateRecruitEnsembleDto,
      id,
    );
  }
}
