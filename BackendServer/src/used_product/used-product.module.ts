import { forwardRef, Module } from '@nestjs/common';
import { UsedProductController } from './used-product.controller';
import { UsedProductService } from './used-product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsedProduct } from './entities/used-product.entity';
import { LocationModule } from 'src/map/location.module';
import { Location } from '../map/entities/location.entity';
import { ImageModule } from 'src/image/image.module';
import { Image } from 'src/image/entities/image.entity';

// -- location import 추가합니다 --
@Module({
  imports: [
    TypeOrmModule.forFeature([UsedProduct, Location, Image]),
    forwardRef(() => LocationModule),
    ImageModule,
  ],
  controllers: [UsedProductController],
  providers: [UsedProductService],
  exports: [UsedProductService],
})
export class UsedProductModule {}
