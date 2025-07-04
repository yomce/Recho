import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplierEnsemble } from './entities/applier-ensemble.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateApplierEnsembleDto } from './dto/create-applier-ensemble.dto';
import { Request } from 'express';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}
  private readonly logger = new Logger(ApplicationController.name);

  @Get(':postId')
  async getApplication(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<ApplierEnsemble[]> {
    this.logger.log('Fetching applier with list');

    const newApplication =
      await this.applicationService.findApplierWithList(postId);
    return newApplication;
  }

  @Post(':postId')
  @UseGuards(AuthGuard('jwt'))
  async enrollApplication(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createApplierEnsembleDto: CreateApplierEnsembleDto,
    @Req() req: Request,
  ): Promise<ApplierEnsemble> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }

    const userId = req.user.id;

    this.logger.log(
      `Apply to new session: ${createApplierEnsembleDto.sessionId}`,
    );
    return await this.applicationService.enrollApplication(
      createApplierEnsembleDto,
      userId,
    );
  }
}
