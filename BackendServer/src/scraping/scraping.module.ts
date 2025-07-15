import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 TypeOrmModule import
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { Promotion } from './entity/promotion.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Promotion]), // 👈 사용할 엔티티의 Repository를 등록
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService],
})
export class ScrapingModule {}