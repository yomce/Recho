import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

// 실제 엔티티 파일들의 경로로 수정
import { Post } from '../community/posts/entities/post.entity';
import { UsedProduct } from '../used_product/entities/used-product.entity';
import { RecruitEnsemble } from '../ensemble/entities/recruit-ensemble.entity';

@Module({
  imports: [
    // 서비스에서 주입받는 모든 엔티티를 여기에 등록해야 합니다.
    TypeOrmModule.forFeature([Post, UsedProduct, RecruitEnsemble]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
