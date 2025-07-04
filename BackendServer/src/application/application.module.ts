import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplyEnsemble } from 'src/application/entities/apply-ensemble.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplyEnsemble])
  ]
})
export class ApplicationModule {}