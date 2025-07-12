import type { User } from '@/stores/authStore';

export enum APPLICATION_STATUS {
  WAITING,
  APPROVAL,
  REJECT,
  CANCEL,
}

export interface Location {
  locationId: string;
  regionLevel1: string;
  regionLevel2: string;
  address: string;
  lat: number;
  lng: number;
}


export interface ApplicationEnsemble {
  applicationId: number;
  recruitEnsemble: RecruitEnsemble;
  sessionEnsemble: SessionEnsemble;
  id: string;
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
  user: User;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  locationId: number;
  location: Location;
  totalRecruitCnt: number;
  recruitStatus: number;
  createdAt: string;
  viewCount: number;
  sessionEnsemble: SessionEnsemble[]
}

export enum SKILL_LEVEL {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  PROFESSIONAL,
}

export const SKILL_LEVEL_DIC: Record<SKILL_LEVEL, string> = {
  [SKILL_LEVEL.BEGINNER]: '초보',
  [SKILL_LEVEL.INTERMEDIATE]: '중급',
  [SKILL_LEVEL.ADVANCED]: '고급',
  [SKILL_LEVEL.PROFESSIONAL]: '전문가',
};

export enum RECRUIT_STATUS {
  RECRUITING,
  COMPLETE,
  CANCEL,
}

export const RECRUIT_STATUS_LABEL: Record<RECRUIT_STATUS, string> = {
  [RECRUIT_STATUS.RECRUITING]: '모집 중',
  [RECRUIT_STATUS.COMPLETE]: '모집 완료',
  [RECRUIT_STATUS.CANCEL]: '취소됨',
};