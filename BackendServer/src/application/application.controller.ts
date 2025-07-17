import {
  Controller,
  Delete,
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
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApplierEnsembleResponseDto } from './dto/applier-ensemble.response.dto';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}
  private readonly logger = new Logger(ApplicationController.name);

  @Get(':postId')
  async getApplication(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<ApplierEnsembleResponseDto[]> {
    this.logger.log('Fetching applier with list');

    const newApplication =
      await this.applicationService.findApplierWithList(postId);
    return newApplication;
  }

  @Post(':postId/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async enrollApplication(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: Request,
  ): Promise<ApplierEnsembleResponseDto> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }

    const id = req.user.id;

    this.logger.log(`Apply to new session: ${sessionId}`);
    return await this.applicationService.enrollApplication(
      postId,
      sessionId,
      id,
    );
  }

  @Delete(':ensembleId/:sessionId/:applicationId')
  @UseGuards(AuthGuard('jwt'))
  async deleteApplication(
    @Param('ensembleId', ParseIntPipe) ensembleId: number,
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }

    console.log('delete req');
    console.log(req);

    const id = req.user.id;

    this.logger.log(`Apply to new session: ${applicationId}`);
    await this.applicationService.deleteApplication(
      ensembleId,
      applicationId,
      id,
    );
  }
}
