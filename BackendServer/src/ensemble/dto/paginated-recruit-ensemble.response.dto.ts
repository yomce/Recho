import { RecruitEnsembleResponseDto } from './recruit-ensemble.response.dto';

export class PaginatedRecruitEnsembleResponse {
  data: RecruitEnsembleResponseDto[];

  nextCursor?: {
    lastPostId: number;
    lastCreateAt: string;
  };

  hasNextPage: boolean;
}
