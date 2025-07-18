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
import { DataSource, Repository } from 'typeorm';
import { EnsembleService } from 'src/ensemble/ensemble.service';
import { UserService } from 'src/auth/user/user.service';
import { ApplierEnsembleResponseDto } from './dto/applier-ensemble.response.dto';
import {
  RECRUIT_STATUS,
  RecruitEnsemble,
} from 'src/ensemble/entities/recruit-ensemble.entity';
import { User } from 'src/auth/user/user.entity';
import { SessionEnsemble } from 'src/ensemble/session/entities/session-ensemble.entity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplierEnsemble)
    private readonly applierEnsembleRepo: Repository<ApplierEnsemble>,

    private readonly ensembleService: EnsembleService,
    private readonly dataSource: DataSource,
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
      const tmpApplier = ApplierEnsembleResponseDto.from(
        applier,
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
    id: string, // 현재 지원하려는 사용자 ID
  ): Promise<ApplierEnsembleResponseDto> {
    // 트랜잭션 시작
    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 모집 게시물 정보 조회 (트랜잭션 매니저 사용)
        // totalRecruitCnt 업데이트를 위해 현재 값을 알아야 하므로 조회는 필요합니다.
        const recruitEnsemblePost = await transactionalEntityManager.findOne(
          RecruitEnsemble,
          {
            where: { postId: postId },
            relations: ['user', 'applierEnsemble', 'applierEnsemble.user'], // 필요한 관계 로드
          },
        );

        if (!recruitEnsemblePost) {
          throw new NotFoundException(`Post with ID "${postId}" not found`);
        }

        // 2. 모집 상태 확인
        if (recruitEnsemblePost.recruitStatus !== RECRUIT_STATUS.RECRUITING) {
          this.logger.error(
            'Attempted to access a post that is not currently recruiting.',
          );
          throw new ForbiddenException('모집 중인 글에만 접근할 수 있습니다.');
        }

        // 3. 게시물 작성자와 지원하려는 사용자가 동일한 경우 확인
        if (recruitEnsemblePost.user.id === id) {
          this.logger.error('Attempted to apply to own post.');
          throw new ForbiddenException(
            '자신이 작성한 글에는 지원할 수 없습니다.',
          );
        }

        // 4. 이미 지원한 사용자인지 확인
        if (
          recruitEnsemblePost.applierEnsemble.some((app) => app.user?.id === id)
        ) {
          this.logger.error(
            'Attempted to apply again by an already applied user.',
          );
          throw new ForbiddenException(
            '이미 지원한 사용자의 잘못된 접근입니다.',
          );
        }

        // 5. 사용자 엔티티 조회
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: id },
        });

        if (!user) {
          throw new NotFoundException(`User with ID "${id}" not found`);
        }

        // 6. 세션 엔티티 조회 (SessionEnsemble 엔티티가 있다고 가정)
        const sessionEnsemble = await transactionalEntityManager.findOne(
          SessionEnsemble,
          {
            where: { sessionId: sessionId },
          },
        );

        if (!sessionEnsemble) {
          throw new NotFoundException(
            `Session with ID "${sessionId}" not found`,
          );
        }

        // 7. 새로운 지원자 생성 (여기서 관계형 엔티티를 직접 할당)
        const newApplier = transactionalEntityManager.create(ApplierEnsemble, {
          recruitEnsemble: recruitEnsemblePost, // 로드된 RecruitEnsemble 엔티티 객체를 직접 할당
          sessionEnsemble: sessionEnsemble, // 로드된 SessionEnsemble 엔티티 객체를 직접 할당
          user: user,
          applicationStatus: APPLICATION_STATUS.WAITING,
        });

        const savedApplier = await transactionalEntityManager.save(newApplier);

        // 8. totalRecruitCnt 증가 (increment 메서드 사용)
        // recruitEnsemblePost.totalRecruitCnt = (recruitEnsemblePost.totalRecruitCnt || 0) + 1;
        // await transactionalEntityManager.save(recruitEnsemblePost); // 이 부분을 increment로 대체
        await transactionalEntityManager.increment(
          RecruitEnsemble, // 업데이트할 엔티티 클래스
          { postId: recruitEnsemblePost.postId }, // 업데이트할 레코드를 찾는 조건
          'totalRecruitCnt', // 증가시킬 컬럼 이름
          1, // 증가량
        );

        const applierDto = ApplierEnsembleResponseDto.from(
          savedApplier,
          savedApplier.sessionEnsemble,
        );
        return applierDto;
      },
    ); // 트랜잭션 끝
  }

  async deleteApplication(
    ensembleId: number, // 모집 게시물 ID (postId)
    applicationId: number, // 지원 ID
    id: string, // 현재 요청하는 사용자 ID
  ): Promise<void> {
    // 트랜잭션 시작
    await this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 모집 게시물 정보 조회 (트랜잭션 매니저 사용)
        const recruitEnsemblePost = await transactionalEntityManager.findOne(
          RecruitEnsemble,
          {
            where: { postId: ensembleId },
          },
        );

        if (!recruitEnsemblePost) {
          throw new NotFoundException(`Post with ID "${ensembleId}" not found`);
        }

        // 2. 지원 정보 조회 (트랜잭션 매니저 사용)
        const application = await transactionalEntityManager.findOne(
          ApplierEnsemble,
          {
            where: { applicationId: applicationId },
            relations: ['user'], // 사용자 정보가 필요하므로 relations 추가
          },
        );

        if (!application) {
          throw new NotFoundException(
            `Application with ID #${applicationId} not found.`,
          );
        }

        // 3. 모집 상태 확인
        if (recruitEnsemblePost.recruitStatus !== RECRUIT_STATUS.RECRUITING) {
          this.logger.error(
            'Attempted to access a post that is not currently recruiting.',
          );
          throw new ForbiddenException('모집 중인 글에만 접근할 수 있습니다.');
        }

        // 4. 권한 확인: 요청한 사용자와 지원서의 사용자가 동일한지 확인
        if (id !== application.user.id) {
          this.logger.warn(
            `Unauthorized attempt to delete application ${applicationId} by user ${id}. Actual owner: ${application.user.id}`,
          );
          throw new ForbiddenException(`Unauthorized`);
        }

        // 5. 지원서 삭제 (트랜잭션 매니저 사용)
        const deleteResult = await transactionalEntityManager.delete(
          ApplierEnsemble,
          {
            applicationId: applicationId,
          },
        );

        if (deleteResult.affected === 0) {
          throw new NotFoundException(
            `Application with ID #${applicationId} not found or already deleted.`,
          );
        }

        // 6. totalRecruitCnt 감소 (decrement 메서드 사용)
        // totalRecruitCnt가 0보다 클 때만 감소하도록 조건을 추가합니다.
        if (
          recruitEnsemblePost.totalRecruitCnt &&
          recruitEnsemblePost.totalRecruitCnt > 0
        ) {
          await transactionalEntityManager.decrement(
            RecruitEnsemble, // 업데이트할 엔티티 클래스
            { postId: recruitEnsemblePost.postId }, // 업데이트할 레코드를 찾는 조건
            'totalRecruitCnt', // 감소시킬 컬럼 이름
            1, // 감소량
          );
        }
      },
    ); // 트랜잭션 종료
  }
}
