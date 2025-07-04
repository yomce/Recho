import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  APPLICATION_STATUS,
  ApplierEnsemble,
} from './entities/applier-ensemble.entity';
import { Repository } from 'typeorm';
import { CreateApplierEnsembleDto } from './dto/create-applier-ensemble.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplierEnsemble)
    private readonly applyEnsembleRepo: Repository<ApplierEnsemble>,
  ) {}

  async findApplierWithList(postId: number): Promise<ApplierEnsemble[]> {
    return await this.applyEnsembleRepo
      .createQueryBuilder('applier')
      .innerJoinAndSelect('applier.recruitEnsemble', 'recruitEnsemble')
      .innerJoinAndSelect('applier.sessionEnsemble', 'sessionEnsemble')
      .where('recruitEnsemble.postId = :postId', { postId })
      .getMany();
  }

  async enrollApplication(
    createDto: CreateApplierEnsembleDto,
    username: string,
  ): Promise<ApplierEnsemble> {
    const applierEnsembleDto = createDto;

    const newApplier = this.applyEnsembleRepo.create({
      recruitEnsemble: { postId: applierEnsembleDto.postId },
      sessionEnsemble: { sessionId: applierEnsembleDto.sessionId },
      username: username,
      applicationStatus: APPLICATION_STATUS.WAITING,
    });

    return await this.applyEnsembleRepo.save(newApplier);
  }
}
