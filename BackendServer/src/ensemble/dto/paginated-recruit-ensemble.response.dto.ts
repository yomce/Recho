import { RecruitEnsembleResponseDto } from './recruit-ensemble.response.dto';

export class PaginatedRecruitEnsembleResponse {
  data: RecruitEnsembleResponseDto[];

  nextCursor?: {
    lastPostId: number;
    lastCreatedAt: string;
  };

  hasNextPage: boolean;
}
