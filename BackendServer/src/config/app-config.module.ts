import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import _ from './env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      load: [_],
    }),
  ],
})
export class AppConfigModule {}
