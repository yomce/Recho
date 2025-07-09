import { Module } from '@nestjs/common';
import { EnsembleController } from './ensemble.controller';
import { EnsembleService } from './ensemble.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { SessionEnsemble } from './session/entities/session-ensemble.entity';
import { UserModule } from 'src/auth/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecruitEnsemble, SessionEnsemble]),
    UserModule,
  ],
  controllers: [EnsembleController],
  providers: [EnsembleService],
  exports: [EnsembleService],
})
export class EnsembleModule {}
