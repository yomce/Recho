import { Module } from '@nestjs/common';
import { UsedProductController } from './used-product.controller';
import { UsedProductService } from './used-product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsedProduct } from './entities/used-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsedProduct])],
  controllers: [UsedProductController],
  providers: [UsedProductService],
})
export class UsedProductModule {}
