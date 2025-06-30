// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller'; // <-- 컨트롤러 import


@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService],
  controllers: [UserController], // <-- 여기에 컨트롤러를 추가
  exports: [UserService],           // ← 꼭 export 해 주어야
})
export class UserModule {}
