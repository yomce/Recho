import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SearchResponseDto } from './dto/search-response.dto';

import { Post } from '../community/entities/post.entity';
import { UsedProduct } from '../used_product/entities/used-product.entity';
import { RecruitEnsemble } from '../ensemble/entities/recruit-ensemble.entity';

@Injectable()
export class SearchService {
  constructor(
    // Post 엔티티 Repository 주입
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    // UsedProduct 엔티티 Repository 주입
    @InjectRepository(UsedProduct)
    private readonly usedProductRepository: Repository<UsedProduct>,

    // RecruitEnsemble 엔티티 Repository 주입
    @InjectRepository(RecruitEnsemble)
    private readonly recruitEnsembleRepository: Repository<RecruitEnsemble>,
  ) {}

  async search(keyword: string): Promise<SearchResponseDto> {
    const searchPattern = `%${keyword}%`;

    // 1. Post 검색 (title, content 컬럼)
    const postsPromise = this.postRepository.find({
      where: [{ title: Like(searchPattern) }, { content: Like(searchPattern) }],
      take: 10,
    });

    // 2. UsedProduct 검색 (title, description 컬럼)
    const usedProductsPromise = this.usedProductRepository.find({
      where: [
        { title: Like(searchPattern) },
        { description: Like(searchPattern) },
      ],
      take: 10,
    });

    // 3. RecruitEnsemble 검색 (title, content 컬럼)
    const recruitEnsemblesPromise = this.recruitEnsembleRepository.find({
      where: [{ title: Like(searchPattern) }, { content: Like(searchPattern) }],
      take: 10,
    });

    // 모든 검색을 병렬로 실행
    const [posts, usedProducts, recruitEnsembles] = await Promise.all([
      postsPromise,
      usedProductsPromise,
      recruitEnsemblesPromise,
    ]);

    // 구조에 맞게 결과 반환
    return { posts, usedProducts, recruitEnsembles };
  }
}
