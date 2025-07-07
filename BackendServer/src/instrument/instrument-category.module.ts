import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstrumentCategory])
  ],
  controllers: [InstrumentController],
  providers: [InstrumentService]
})
export class InstrumentCategoryModule {}