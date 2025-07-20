import { forwardRef, Module } from '@nestjs/common';
import { PracticeRoomController } from './practice-room.controller';
import { PracticeRoomService } from './practice-room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeRoom } from './entities/practice-room.entity';
import { LocationModule } from 'src/map/location.module';
import { UserModule } from 'src/auth/user/user.module';
import { User } from 'src/auth/user/user.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PracticeRoom, User]),
    forwardRef(() => LocationModule),
    UserModule,
    ImageModule,
  ],
  controllers: [PracticeRoomController],
  providers: [PracticeRoomService],
  exports: [PracticeRoomService],
})
export class PracticeRoomModule {}
