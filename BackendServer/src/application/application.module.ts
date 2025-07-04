import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { EnsembleService } from 'src/ensemble/ensemble.service';
import { RecruitEnsemble } from 'src/ensemble/entities/recruit-ensemble.entity';
import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplierEnsemble,
      RecruitEnsemble,
      SessionEnsemble,
    ]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, EnsembleService],
})
export class ApplicationModule {}
