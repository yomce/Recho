import { forwardRef, Module } from '@nestjs/common';
import { EnsembleController } from './ensemble.controller';
import { EnsembleService } from './ensemble.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { SessionEnsemble } from './session/entities/session-ensemble.entity';
import { UserModule } from 'src/auth/user/user.module';
import { LocationModule } from 'src/map/location.module';
import { ChatModule } from 'src/chat/chat.module';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruitEnsemble,
      SessionEnsemble,
      ApplierEnsemble,
    ]),
    UserModule,
    forwardRef(() => LocationModule),
    ChatModule,
    ImageModule,
  ],
  controllers: [EnsembleController],
  providers: [EnsembleService],
  exports: [EnsembleService],
})
export class EnsembleModule {}
