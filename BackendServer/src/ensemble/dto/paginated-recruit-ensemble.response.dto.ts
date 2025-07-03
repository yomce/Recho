import { RecruitEnsemble } from '../entities/recruit-ensemble.entity';

export class PaginatedRecruitEnsembleResponse {
  data: RecruitEnsemble[];

  nextCursor?: {
    lastPostId: number;
    lastCreateAt: string;
  };

  hasNextPage: boolean;
}
