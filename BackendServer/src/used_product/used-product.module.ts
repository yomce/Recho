import { Module } from '@nestjs/common';
import { UsedProductController } from './used-product.controller';
import { UsedProductService } from './used-product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsedProduct } from './entities/used-product.entity';
import { Location } from 'src/map/entities/location.entity';

// -- location import 추가합니다 -- 
@Module({
  imports: [TypeOrmModule.forFeature([UsedProduct, Location]),],
  controllers: [UsedProductController],
  providers: [UsedProductService],
})
export class UsedProductModule {}
