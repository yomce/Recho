import { forwardRef, Module } from "@nestjs/common";
import { PracticeRoomController } from "./practice-room.controller";
import { PracticeRoomService } from "./practice-room.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PracticeRoom } from "./entities/practice-room.entity";
import { LocationModule } from "src/map/location.module";

@Module({
  imports: [TypeOrmModule.forFeature([PracticeRoom]),
  forwardRef(() => LocationModule)
  ],
  controllers: [PracticeRoomController],
  providers: [PracticeRoomService],
  exports: [PracticeRoomService]
})

export class PracticeRoomModule {}