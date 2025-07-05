import { Module } from "@nestjs/common";
import { ViewCountController } from "./view-count.controller";
import { ViewCountService } from "./view-count.service";
import { EnsembleModule } from "src/ensemble/ensemble.module";
import { UsedProductModule } from "src/used_product/used-product.module";
import { PracticeRoomModule } from "src/practice_room/practice-room.module";

@Module({
  imports: [EnsembleModule, UsedProductModule, PracticeRoomModule],
  controllers: [ViewCountController],
  providers: [ViewCountService],
})

export class ViewCountModule {}