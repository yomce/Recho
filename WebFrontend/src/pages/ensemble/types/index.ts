import type { SKILL_LEVEL } from '../components/EnsembleForm';

export interface SessionEnsemble {
  sessionId: number;
  instrument: string;
  recruitCount: number;
}

export interface RecruitEnsemble {
  postId: number;
  title: string;
  content: string;
  userId: string;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  locationId: number;
  totalRecruitCnt: number;
  recruitStatus: number;
  createdAt: string;
  viewCount: number;
  sessionEnsemble: SessionEnsemble[]
}