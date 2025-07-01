import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RECRUIT_STATUS, RecruitEnsemble } from './entities/recruit-ensemble.entity';
import { Repository } from 'typeorm';
import { SessionEnsemble } from './entities/session-ensemble.entity';
import { ApplyEnsemble } from './entities/apply-ensemble.entity';
import { PaginatedEnsembleResponse } from './dto/paginated-ensemble.response.dto';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';

@Injectable()
export class EnsembleService {
  constructor(
    @InjectRepository(RecruitEnsemble)
    private readonly recruitEnsembleRepo: Repository<RecruitEnsemble>,

    @InjectRepository(SessionEnsemble)
    private readonly instrumentalEnsembleRepo: Repository<SessionEnsemble>,

    @InjectRepository(ApplyEnsemble)
    private readonly applyEnsembleRepo: Repository<ApplyEnsemble>,
  ) {}

  async findEnsembleWithPagination(
    limit: number,
    lastPostId?: number,
    lastCreateAt?: Date,
  ): Promise<PaginatedEnsembleResponse> {
    const realLimit = limit + 1;
    const queryBuilder =
      this.recruitEnsembleRepo.createQueryBuilder('recruitEnsemble');

    if (lastPostId && lastCreateAt) {
      const lastCreatedAtDate = new Date(lastCreateAt);
      queryBuilder.where(
        '(recruitEnsemble.createdAt < :lastCreatedAtDate) OR (recruitEnsemble.createdAt = :lastCreatedAtDate AND recruitEnsemble.postId < :lastPostId)',
        { lastCreatedAtDate, lastPostId },
      );
    }

    const results = await queryBuilder
      .orderBy('recruitEnsemble.createdAt', 'DESC')
      .addOrderBy('recruitEnsemble.postId', 'DESC')
      .take(realLimit)
      .getMany();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;

    const lastItem = data[data.length - 1];
    const nextCursor =
      hasNextPage && lastItem
        ? {
            lastPostId: lastItem.postId,
            lastCreateAt: lastItem.createdAt.toISOString(),
          }
        : undefined;

    return {
      data,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollEnsemble(
    createDto: CreateRecruitEnsembleDto,
  ): Promise<RecruitEnsemble> {
    const recruitEnsembleDto = createDto;

    const newEnsemble = this.recruitEnsembleRepo.create({
      ...recruitEnsembleDto,
      recruit_status: RECRUIT_STATUS.RECRUITING,
      viewCount: 0,
    });
    return await this.recruitEnsembleRepo.save(newEnsemble);
  }
}
