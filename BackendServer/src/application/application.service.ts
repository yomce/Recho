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
import { ApplierEnsembleResponseDto } from './dto/applier-ensemble.response.dto';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { RECRUIT_STATUS } from 'src/ensemble/entities/recruit-ensemble.entity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplierEnsemble)
    private readonly applierEnsembleRepo: Repository<ApplierEnsemble>,

    private readonly ensembleService: EnsembleService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(ApplicationService.name);

  async findApplierWithList(
    postId: number,
  ): Promise<ApplierEnsembleResponseDto[]> {
    const savedAppliers = await this.applierEnsembleRepo
      .createQueryBuilder('applier')
      .innerJoinAndSelect('applier.user', 'user')
      .innerJoinAndSelect('applier.sessionEnsemble', 'sessionEnsemble')
      .innerJoin('applier.recruitEnsemble', 'recruitEnsemble')
      .where('recruitEnsemble.postId = :postId', { postId })
      .getMany();

    const appliersDto = savedAppliers.map((applier) => {
      const userDto = UserResponseDto.from(applier.user)
      const tmpApplier = ApplierEnsembleResponseDto.from(
        applier,
        userDto,
        applier.sessionEnsemble,
      );
      return tmpApplier;
    });

    return appliersDto;
  }

  async detailApplication(applicationId: number): Promise<ApplierEnsemble> {
    const newApplierEnsemble = await this.applierEnsembleRepo.findOne({
      where: { applicationId },
      relations: ['user'],
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
  ): Promise<ApplierEnsembleResponseDto> {
    const recruitEnsemblePost =
      await this.ensembleService.detailEnsemble(postId);

    if (recruitEnsemblePost.recruitStatus !== RECRUIT_STATUS.RECRUITING) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('동일한 사용자의 잘못된 접근입니다.');
    }

    if (recruitEnsemblePost.user.id === id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('동일한 사용자의 잘못된 접근입니다.');
    }

    if (
      recruitEnsemblePost.applierEnsemble.some((app) => app.user?.id === id)
    ) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('이미 지원한 사용자의 잘못된 접근입니다.');
    }

    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const newApplier = this.applierEnsembleRepo.create({
      recruitEnsemble: { postId: postId },
      sessionEnsemble: { sessionId: sessionId },
      user: user,
      applicationStatus: APPLICATION_STATUS.WAITING,
    });

    const savedApplier = await this.applierEnsembleRepo.save(newApplier);
    const userDto = UserResponseDto.from(savedApplier.user);

    const applierDto = ApplierEnsembleResponseDto.from(
      savedApplier,
      userDto,
      savedApplier.sessionEnsemble,
    );
    return applierDto;
  }

  async deleteApplication(applicationId: number, id: string): Promise<void> {
    const application = await this.detailApplication(applicationId);
    console.log('delete application service');
    console.log(application);

    if (id !== application?.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.applierEnsembleRepo.delete({
      applicationId: applicationId,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Application with ID #${applicationId} not found.`,
      );
    }
  }
}
