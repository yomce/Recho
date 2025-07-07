import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  APPLICATION_STATUS,
  ApplierEnsemble,
} from './entities/applier-ensemble.entity';
import { Repository } from 'typeorm';
import { EnsembleService } from 'src/ensemble/ensemble.service';
import { UserService } from 'src/auth/user/user.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplierEnsemble)
    private readonly applyEnsembleRepo: Repository<ApplierEnsemble>,

    private readonly userService: UserService,
    private readonly ensembleService: EnsembleService,
  ) {}
  private readonly logger = new Logger(ApplicationService.name);

  async findApplierWithList(postId: number): Promise<ApplierEnsemble[]> {
    return await this.applyEnsembleRepo
      .createQueryBuilder('applier')
      .innerJoinAndSelect('applier.recruitEnsemble', 'recruitEnsemble')
      .innerJoinAndSelect('applier.sessionEnsemble', 'sessionEnsemble')
      .where('recruitEnsemble.postId = :postId', { postId })
      .getMany();
  }

  async detailApplication(applicationId: number): Promise<ApplierEnsemble> {
    const newApplierEnsemble = await this.applyEnsembleRepo.findOneBy({
      applicationId: applicationId,
    });
    if (!newApplierEnsemble) {
      throw new NotFoundException(
        `application with ID #${applicationId} not found.`,
      );
    }
    return newApplierEnsemble;
  }

  async enrollApplication(
    postId: number,
    sessionId: number,
    id: string,
  ): Promise<ApplierEnsemble> {
    const recruitEnsemblePost =
      await this.ensembleService.detailEnsemble(postId);

    if (recruitEnsemblePost.user.id === id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('동일한 사용자의 잘못된 접근입니다.');
    }

    if (recruitEnsemblePost.applierEnsemble.some((app) => app.user.id === id)) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('이미 지원한 사용자의 잘못된 접근입니다.');
    }

    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const newApplier = this.applyEnsembleRepo.create({
      recruitEnsemble: { postId: postId },
      sessionEnsemble: { sessionId: sessionId },
      user: user,
      applicationStatus: APPLICATION_STATUS.WAITING,
    });

    return await this.applyEnsembleRepo.save(newApplier);
  }

  async deleteApplication(applicationId: number, id: string): Promise<void> {
    const application = await this.detailApplication(applicationId);
    if (id !== application?.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.applyEnsembleRepo.delete({
      applicationId: applicationId,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Application with ID #${applicationId} not found.`,
      );
    }
  }
}
