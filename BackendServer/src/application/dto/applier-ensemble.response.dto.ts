import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';
import { ApplierEnsemble } from '../entities/applier-ensemble.entity';

export class ApplierEnsembleResponseDto {
  applicationId: number;
  sessionEnsemble: SessionEnsemble;

  static from(
    applier: ApplierEnsemble,
    sessionEnsemble: SessionEnsemble,
  ): ApplierEnsembleResponseDto {
    const dto = new ApplierEnsembleResponseDto();

    dto.applicationId = applier.applicationId;
    dto.sessionEnsemble = sessionEnsemble;

    return dto;
  }
}
