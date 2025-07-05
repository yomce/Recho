import { Module } from '@nestjs/common';
import { EnsembleController } from './ensemble.controller';
import { EnsembleService } from './ensemble.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { SessionEnsemble } from './session/entities/session-ensemble.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitEnsemble, SessionEnsemble])],
  controllers: [EnsembleController],
  providers: [EnsembleService],
})
export class EnsembleModule {}
