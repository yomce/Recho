import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';                                                                                              1


import { Message } from './entities/message.entity';
import { Room } from './entities/room.entity';
import { UserRoom } from './entities/user-room.entity';
import { UserModule } from '../auth/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room, UserRoom]),  // ← 이 줄이 반드시 필요
    UserModule,
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController]
})
export class ChatModule {}
