import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 TypeOrmModule import
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';
import { Promotion } from './entity/promotion.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Promotion]), // 👈 사용할 엔티티의 Repository를 등록
  ],
  controllers: [PromotionController],
  providers: [PromotionService],
})
export class PromotionModule {}
