import { Module } from "@nestjs/common";
import { PracticeRoomController } from "./practice-room.controller";
import { PracticeRoomService } from "./practice-room.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PracticeRoom } from "./entities/practice-room.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PracticeRoom])],
  controllers: [PracticeRoomController],
  providers: [PracticeRoomService],
})

export class PracticeRoomModule {}