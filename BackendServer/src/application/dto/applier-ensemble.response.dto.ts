import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';
import { ApplierEnsemble } from '../entities/applier-ensemble.entity';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';

export class ApplierEnsembleResponseDto {
  applicationId: number;
  sessionEnsemble: SessionEnsemble;
  user: UserResponseDto;

  static from(
    applier: ApplierEnsemble,
    sessionEnsemble: SessionEnsemble,
    user: UserResponseDto,
  ): ApplierEnsembleResponseDto {
    const dto = new ApplierEnsembleResponseDto();

    dto.applicationId = applier.applicationId;
    dto.sessionEnsemble = sessionEnsemble;
    dto.user = user;

    return dto;
  }
}
