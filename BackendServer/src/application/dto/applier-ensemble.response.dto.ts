import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';
import { ApplierEnsemble } from '../entities/applier-ensemble.entity';

export class ApplierEnsembleResponseDto {
  applicationId: number;
  user: UserResponseDto;
  sessionEnsemble: SessionEnsemble;

  static from(
    applier: ApplierEnsemble,
    userResponseDto: UserResponseDto,
    sessionEnsemble: SessionEnsemble,
  ): ApplierEnsembleResponseDto {
    const dto = new ApplierEnsembleResponseDto();

    dto.applicationId = applier.applicationId;
    dto.user = userResponseDto;
    dto.sessionEnsemble = sessionEnsemble;

    return dto;
  }
}
