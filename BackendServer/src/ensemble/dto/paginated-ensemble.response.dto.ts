import { RecruitEnsemble } from '../entities/recruit-ensemble.entity';

export class PaginatedEnsembleResponse {
  data: RecruitEnsemble[];

  nextCursor?: {
    lastPostId: number;
    lastCreateAt: string;
  };

  hasNextPage: boolean;
}
