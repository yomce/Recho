import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { SessionEnsemble } from '../session/entities/session-ensemble.entity';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import {
  RECRUIT_STATUS,
  RecruitEnsemble,
  SKILL_LEVEL,
} from '../entities/recruit-ensemble.entity';
import { Location } from 'src/map/entities/location.entity';
import { Entity } from 'typeorm';

export class RecruitEnsembleResponseDto {
  postId: number;
  user: UserResponseDto;
  title: string;
  content: string;
  eventDate: Date;
  skillLevel: SKILL_LEVEL;
  location: Location;
  locationId: number;
  totalRecruitCnt: number;
  recruitStatus: RECRUIT_STATUS;
  createdAt: Date;
  viewCount: number;
  sessionEnsemble: SessionEnsemble[];
  applierEnsemble: ApplierEnsemble[];

  static from(
    recruitEnsemble: RecruitEnsemble,
    userResponseDto: UserResponseDto,
  ): RecruitEnsembleResponseDto {
    const dto = new RecruitEnsembleResponseDto();

    dto.postId = recruitEnsemble.postId;
    dto.user = userResponseDto;
    dto.title = recruitEnsemble.title;
    dto.content = recruitEnsemble.content;
    dto.eventDate = recruitEnsemble.eventDate;
    dto.skillLevel = recruitEnsemble.skillLevel;
    dto.location = recruitEnsemble.location;
    dto.locationId = recruitEnsemble.locationId;
    dto.totalRecruitCnt = recruitEnsemble.totalRecruitCnt;
    dto.recruitStatus = recruitEnsemble.recruitStatus;
    dto.createdAt = recruitEnsemble.createdAt;
    dto.viewCount = recruitEnsemble.viewCount;
    dto.sessionEnsemble = recruitEnsemble.sessionEnsemble;
    dto.applierEnsemble = recruitEnsemble.applierEnsemble;

    return dto;
  }
}
