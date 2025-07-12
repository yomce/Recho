import { forwardRef, Module } from '@nestjs/common';
import { EnsembleController } from './ensemble.controller';
import { EnsembleService } from './ensemble.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { SessionEnsemble } from './session/entities/session-ensemble.entity';
import { UserModule } from 'src/auth/user/user.module';
import { LocationModule } from 'src/map/location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecruitEnsemble, SessionEnsemble]),
    UserModule,
    forwardRef(() => LocationModule),
  ],
  controllers: [EnsembleController],
  providers: [EnsembleService],
  exports: [EnsembleService],
})
export class EnsembleModule {}
