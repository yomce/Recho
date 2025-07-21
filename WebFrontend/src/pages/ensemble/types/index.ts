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
  place_name: string;
  lat: number;
  lng: number;
}


export interface ApplicationEnsemble {
  applicationId: number;
  recruitEnsemble: RecruitEnsemble;
  sessionEnsemble: SessionEnsemble;
  user: User;
  applicationStatus: APPLICATION_STATUS;
  appliedAt: string;
  approvedAt?: string;
}

export interface SessionEnsemble {
  sessionId: number;
  instrument: string;
  recruitCount: number;
  nowRecruitCount: number;
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
  totalUnreadCount?: number;
}

export enum SKILL_LEVEL {
  BEGINNER = 0,
  INTERMEDIATE = 1,
  ADVANCED = 2,
  PROFESSIONAL = 3,
}

export const SKILL_LEVEL_DIC: Record<SKILL_LEVEL, string> = {
  [SKILL_LEVEL.BEGINNER]: '초급',
  [SKILL_LEVEL.INTERMEDIATE]: '중급',
  [SKILL_LEVEL.ADVANCED]: '고급',
  [SKILL_LEVEL.PROFESSIONAL]: '전문가',
};

// 문자열 → 숫자 enum 역변환 맵 생성
export const REVERSE_SKILL_LEVEL_DIC: Record<string, SKILL_LEVEL> = Object.fromEntries(
  Object.entries(SKILL_LEVEL_DIC).map(([key, label]) => [label, Number(key)])
);

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

export enum INSTRUMENT {
  ELECTRIC = '일렉기타',
  BASS = '베이스기타',
  ACOUSTIC = '어쿠스틱기타',
  PIANO = '피아노',
  DRUM = '드럼',
  VOCAL = '보컬',
};

export const INSTRUMENT_OPTIONS = Object.values(INSTRUMENT);

export interface PaginatedEnsembleResponse {
  data: RecruitEnsemble[];
  nextCursor?: {
    lastPostId: number;
    lastCreatedAt: string;
  };
  hasNextPage: boolean;
  filters?: {
    eventDate?: string;
    skillLevel?: SKILL_LEVEL;
    instrument?: string;
    location?: string;
  }
}