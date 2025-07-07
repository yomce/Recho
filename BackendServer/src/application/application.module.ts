import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { EnsembleModule } from 'src/ensemble/ensemble.module';
import { UserModule } from 'src/auth/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplierEnsemble]),
    EnsembleModule,
    UserModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
