import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApplierEnsemble])],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
