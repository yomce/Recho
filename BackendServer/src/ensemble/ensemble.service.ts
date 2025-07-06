import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RECRUIT_STATUS,
  RecruitEnsemble,
} from './entities/recruit-ensemble.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { SessionEnsemble } from './session/entities/session-ensemble.entity';
import { PaginatedRecruitEnsembleResponse } from './dto/paginated-recruit-ensemble.response.dto';
import { CreateRecruitEnsembleDto } from './dto/create-recruit-ensemble.dto';
import { UpdateRecruitEnsembleDto } from './dto/update-recruit-ensemble.dto';
import {
  CreateSessionEnsembleDto,
  UpdateSessionDto,
} from './session/dto/create-session-ensemble.dto';
import { UserService } from 'src/auth/user/user.service';
import { RecruitEnsembleResponseDto } from './dto/recruit-ensemble.response.dto';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';

@Injectable()
export class EnsembleService {
  constructor(
    @InjectRepository(RecruitEnsemble)
    private readonly recruitEnsembleRepo: Repository<RecruitEnsemble>,

    @InjectRepository(SessionEnsemble)
    private readonly sessionEnsembleRepo: Repository<SessionEnsemble>,

    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  async findEnsembleWithPagination(
    limit: number,
    lastPostId?: number,
    lastCreateAt?: Date,
  ): Promise<PaginatedRecruitEnsembleResponse> {
    const realLimit = limit + 1;
    const queryBuilder =
      this.recruitEnsembleRepo.createQueryBuilder('recruitEnsemble');

    if (lastPostId && lastCreateAt) {
      const lastCreatedAtDate = new Date(lastCreateAt);
      queryBuilder.where(
        '(recruitEnsemble.createdAt < :lastCreatedAtDate) OR (recruitEnsemble.createdAt = :lastCreatedAtDate AND recruitEnsemble.postId < :lastPostId)',
        { lastCreatedAtDate, lastPostId },
      );
    }

    const results = await queryBuilder
      .orderBy('recruitEnsemble.createdAt', 'DESC')
      .addOrderBy('recruitEnsemble.postId', 'DESC')
      .take(realLimit)
      .getMany();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;

    const lastItem = data[data.length - 1];
    const nextCursor =
      hasNextPage && lastItem
        ? {
            lastPostId: lastItem.postId,
            lastCreateAt: lastItem.createdAt.toISOString(),
          }
        : undefined;
    return {
      data,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollEnsemble(
    createDto: CreateRecruitEnsembleDto,
    id: string,
  ): Promise<RecruitEnsembleResponseDto> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const recruitEnsembleDto = createDto;
      const user = await this.userService.findById(id);

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      const newEnsemble = this.recruitEnsembleRepo.create({
        ...recruitEnsembleDto,
        user: user,
        recruitStatus: RECRUIT_STATUS.RECRUITING,
        viewCount: 0,
      });

      const savedEnsemble = await transactionalEntityManager.save(newEnsemble);
      const postId = savedEnsemble.postId;

      for (const itemDto of createDto.sessionList) {
        await this.enrollSession(itemDto, postId, transactionalEntityManager);
      }

      const userResponse = UserResponseDto.from(user);
      const savedEnsembleResponse = RecruitEnsembleResponseDto.from(
        savedEnsemble,
        userResponse,
      );
      return savedEnsembleResponse;
    });
  }

  async enrollSession(
    createDto: CreateSessionEnsembleDto,
    postId: number,
    manager: EntityManager,
  ) {
    const sessionEnsembleDto = createDto;

    const newSessionEnsemble = manager.create(SessionEnsemble, {
      ...sessionEnsembleDto,
      recruitEnsemble: { postId: postId },
      nowRecruitCount: 0,
    });
    await manager.save(SessionEnsemble, newSessionEnsemble);
  }

  async detailEnsemble(id: number): Promise<RecruitEnsembleResponseDto> {
    const ensemble = await this.recruitEnsembleRepo.findOne({
      where: { postId: id },
      relations: ['sessionEnsemble', 'applierEnsemble', 'user'],
    });
    if (!ensemble) {
      throw new NotFoundException(`Ensemble with ID #${id} not found.`);
    }
    const responseUser = UserResponseDto.from(ensemble.user);
    const responseEnsemble = RecruitEnsembleResponseDto.from(
      ensemble,
      responseUser,
    );

    return responseEnsemble;
  }

  async detailSession(id: number): Promise<SessionEnsemble> {
    const session = await this.sessionEnsembleRepo.findOneBy({
      sessionId: id,
    });
    if (!session) {
      throw new NotFoundException(`Ensemble with ID #${id} not found.`);
    }
    return session;
  }

  async detailSessionList(id: number): Promise<SessionEnsemble[]> {
    const session = await this.sessionEnsembleRepo.findBy({
      sessionId: id,
    });
    if (!session) {
      throw new NotFoundException(`Ensemble with ID #${id} not found.`);
    }
    return session;
  }

  async deleteEnsemble(postId: number, id: string): Promise<void> {
    const ensemble = await this.detailEnsemble(postId);
    if (id !== ensemble?.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.recruitEnsembleRepo.delete({ postId: postId });
    if (result.affected === 0) {
      throw new NotFoundException(`Ensemble with ID #${id} not found.`);
    }
  }

  async deleteSession(id: number, postId: number): Promise<void> {
    const session = await this.detailSession(id);
    const sessionPostId = session.recruitEnsemble.postId;
    if (sessionPostId != postId) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.sessionEnsembleRepo.delete({ sessionId: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID #${id} not found.`);
    }
  }

  async patchEnsemble(
    postId: number,
    updateDto: UpdateRecruitEnsembleDto,
    id: string,
  ): Promise<RecruitEnsembleResponseDto> {
    // 1. 데이터베이스 커넥션에서 QueryRunner를 가져옵니다.
    const queryRunner =
      this.recruitEnsembleRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ==================== 트랜잭션 시작 ====================

      // 2. 권한 확인 (트랜잭션 내에서 데이터를 다시 조회하여 최신 상태 보장)
      const ensemble = await queryRunner.manager.findOne(RecruitEnsemble, {
        where: { postId },
        relations: ['sessionEnsemble', 'user'],
      });

      if (!ensemble) {
        throw new NotFoundException(`Ensemble with ID #${postId} not found.`);
      }
      console.log('-----------');
      console.log(id);
      console.log(ensemble);
      console.log('-----------');

      if (id !== ensemble.user.id) {
        throw new ForbiddenException(`Unauthorized`);
      }

      // 3. 자식 엔티티(Session)에 대한 추가/수정/삭제 처리
      if (updateDto.sessionList) {
        const sessionMap = new Map(
          ensemble.sessionEnsemble.map((session) => [
            session.sessionId,
            session,
          ]),
        );
        const toAdd: CreateSessionEnsembleDto[] = [];
        const toUpdate: CreateSessionEnsembleDto[] = [];

        for (const item of updateDto.sessionList) {
          if (item.sessionId && sessionMap.has(item.sessionId)) {
            toUpdate.push(item);
            sessionMap.delete(item.sessionId);
          } else {
            toAdd.push(item);
          }
        }

        const toDeleteIds = [...sessionMap.keys()];

        // 3-1. 삭제: 여러 ID를 한 번에 삭제하여 효율적
        if (toDeleteIds.length > 0) {
          await queryRunner.manager.delete(SessionEnsemble, {
            sessionId: In(toDeleteIds),
          });
        }

        // 3-2. 수정: 각 항목을 순회하며 업데이트
        for (const item of toUpdate) {
          await queryRunner.manager.update(SessionEnsemble, item.sessionId, {
            instrument: item.instrument,
            recruitCount: item.recruitCount,
          });
        }

        // 3-3. 추가: 여러 항목을 한 번에 추가하여 효율적
        if (toAdd.length > 0) {
          const newSessions = toAdd.map((item) =>
            queryRunner.manager.create(SessionEnsemble, {
              ...item,
              nowRecruitCount: 0,
              recruitEnsemble: ensemble, // 부모 객체를 직접 참조
            }),
          );
          await queryRunner.manager.save(newSessions);
        }
      }

      // 4. 부모 엔티티(Ensemble)의 필드 머지(업데이트) 처리
      const { sessionList, ...ensembleDto } = updateDto;
      await queryRunner.manager.update(RecruitEnsemble, postId, ensembleDto);

      // 5. 모든 작업이 성공하면 트랜잭션을 커밋합니다.
      await queryRunner.commitTransaction();

      // 6. 최신 상태의 데이터를 다시 조회하여 반환합니다.
      return this.detailEnsemble(postId);
    } catch (err) {
      // 에러 발생 시 모든 변경사항을 롤백합니다.
      await queryRunner.rollbackTransaction();
      throw err; // 에러를 다시 던져서 상위에서 처리하도록 함
    } finally {
      // 성공하든 실패하든 QueryRunner를 해제하여 커넥션을 반환합니다.
      await queryRunner.release();
    }
  }

  async patchSession(
    id: number,
    updateDto: UpdateSessionDto,
    postId: number,
  ): Promise<SessionEnsemble> {
    const session = await this.detailSession(id);
    if (postId !== session.recruitEnsemble.postId) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const updatedSession = this.sessionEnsembleRepo.merge(session, updateDto);
    return this.sessionEnsembleRepo.save(updatedSession);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.recruitEnsembleRepo.increment({ postId: id }, 'viewCount', 1);
  }
}
