import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { UsedProductModule } from 'src/used_product/used-product.module';
import { LocationCleanerService } from './location.cleaner.service';
import { PracticeRoomModule } from 'src/practice_room/practice-room.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    forwardRef(() => UsedProductModule),
    forwardRef(() => PracticeRoomModule),
    HttpModule,
  ],
  controllers: [LocationController],
  providers: [LocationService, LocationCleanerService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
