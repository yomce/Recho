import { Module } from '@nestjs/common';
import { VideoInsertService } from './video-insert.service';
import { VideoInsertController } from './video-insert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from 'src/videos/entities';
import { UserModule } from 'src/auth/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Video]), UserModule],
  providers: [VideoInsertService],
  controllers: [VideoInsertController],
})
export class VideoInsertModule {}
