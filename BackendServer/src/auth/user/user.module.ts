// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller'; // <-- 컨트롤러 import
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ImageModule],
  providers: [UserService],
  controllers: [UserController], // <-- 여기에 컨트롤러를 추가
  exports: [UserService], // ← 꼭 export 해 주어야
})
export class UserModule {}
