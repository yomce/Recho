import { forwardRef, Module } from '@nestjs/common';
import { UsedProductController } from './used-product.controller';
import { UsedProductService } from './used-product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsedProduct } from './entities/used-product.entity';
import { LocationModule } from 'src/map/location.module';
import { Location } from '../map/entities/location.entity';
import { UserModule } from 'src/auth/user/user.module';

// -- location import 추가합니다 --
@Module({
  imports: [
    TypeOrmModule.forFeature([UsedProduct, Location]),
    forwardRef(() => LocationModule),
    UserModule,
  ],
  controllers: [UsedProductController],
  providers: [UsedProductService],
  exports: [UsedProductService],
})
export class UsedProductModule {}
