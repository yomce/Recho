import type { SKILL_LEVEL } from '../components/EnsembleForm';

export enum APPLICATION_STATUS {
  WAITING,
  APPROVAL,
  REJECT,
  CANCEL,
}

export interface ApplicationEnsemble {
  applicationId: number;
  recruitEnsemble: RecruitEnsemble;
  sessionEnsemble: SessionEnsemble;
  username: string;
  applicationStatus: APPLICATION_STATUS;
  appliedAt: string;
  approvedAt?: string;
}

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