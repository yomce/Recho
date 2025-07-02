// src/app.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from './videos/videos.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './auth/user/user.module';
import { VideoInsertModule } from './video-insert/video-insert.module';
import { ChatModule } from './chat/chat.module';
import { UsedProductModule } from './used_product/used-product.module';
import { UsedProduct } from './used_product/entities/used-product.entity';
import { EnsembleModule } from './ensemble/ensemble.module';
import { RecruitEnsemble } from './ensemble/entities/recruit-ensemble.entity';
import { SessionEnsemble } from './ensemble/entities/session-ensemble.entity';
import { ApplyEnsemble } from './ensemble/entities/apply-ensemble.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'postgres',
        host: cs.get<string>('DB_HOST'),
        port: cs.get<number>('DB_PORT'),
        username: cs.get<string>('DB_USERNAME'),
        password: cs.get<string>('DB_PASSWORD'),
        database: cs.get<string>('DB_NAME'),
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
          UsedProduct,
          RecruitEnsemble,
          SessionEnsemble,
          ApplyEnsemble,
        ],
        synchronize: true,
        logging: true,
        dropSchema: false,
        timezone: 'UTC',
      }),
    }),

    AuthModule,
    UserModule,
    VideosModule,
    VideoInsertModule,
    ChatModule,
    UsedProductModule,
    EnsembleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
