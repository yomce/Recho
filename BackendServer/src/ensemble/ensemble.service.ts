import {
  ConflictException,
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
import { Location } from 'src/map/entities/location.entity';
import { ChatService } from 'src/chat/chat.service';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { RoomType } from 'src/chat/dto/create-room.dto';

@Injectable()
export class EnsembleService {
  constructor(
    @InjectRepository(RecruitEnsemble)
    private readonly recruitEnsembleRepo: Repository<RecruitEnsemble>,

    @InjectRepository(SessionEnsemble)
    private readonly sessionEnsembleRepo: Repository<SessionEnsemble>,

    @InjectRepository(ApplierEnsemble)
    private readonly applierEnsembleRepo: Repository<ApplierEnsemble>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,

    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatService,
  ) {}

  async findEnsembleWithPagination(
    limit: number,
    lastPostId?: number,
    lastCreatedAt?: Date,
  ): Promise<PaginatedRecruitEnsembleResponse> {
    const realLimit = limit + 1;
    const queryBuilder = this.recruitEnsembleRepo
      .createQueryBuilder('recruitEnsemble')
      .leftJoinAndSelect('recruitEnsemble.location', 'location');

    if (lastPostId && lastCreatedAt) {
      const lastCreatedAtDate = new Date(lastCreatedAt);
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
            lastCreatedAt: lastItem.createdAt.toISOString(),
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
      const { locationId, ...recruitEnsembleDto } = createDto;
      const user = await this.userService.findById(id);

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      const locationEntity = await this.locationRepo.findOneBy({
        locationId: Number(locationId),
      });

      if (!locationEntity) {
        throw new NotFoundException(
          `Location with ID#${locationId} not found.`,
        );
      }

      const newEnsemble = this.recruitEnsembleRepo.create({
        ...recruitEnsembleDto,
        user: user,
        recruitStatus: RECRUIT_STATUS.RECRUITING,
        viewCount: 0,
        location: locationEntity,
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

  async closeRecruitment(
    postId: number,
    userId: string,
  ): Promise<RecruitEnsembleResponseDto> {
    // 1. 게시물을 DB에서 찾습니다. 이때 작성자 정보(user)도 함께 가져옵니다.
    const recruitEnsemble = await this.recruitEnsembleRepo.findOne({
      where: { postId },
      relations: ['user'], // 작성자 ID를 비교하기 위해 user 관계를 로드합니다.
    });

    // 게시물이 없는 경우
    if (!recruitEnsemble) {
      throw new NotFoundException(
        `Recruitment post with ID #${postId} not found.`,
      );
    }

    // 2. 요청한 사용자가 게시물 작성자가 맞는지 권한을 확인합니다.
    if (recruitEnsemble.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to close this recruitment.',
      );
    }

    // 이미 모집 종료된 게시물인지 확인합니다.
    if (recruitEnsemble.recruitStatus !== RECRUIT_STATUS.RECRUITING) {
      throw new ConflictException('This recruitment is already closed.'); // 409 Conflict 에러
    }

    // 3. 모집 상태를 '모집 완료'로 변경합니다.
    // RECRUIT_STATUS에 '모집 완료'에 해당하는 상태값이 정의되어 있어야 합니다.
    // 예: export enum RECRUIT_STATUS { RECRUITING = 'RECRUITING', CLOSED = 'CLOSED' }
    recruitEnsemble.recruitStatus = RECRUIT_STATUS.COMPLETE;

    // 4. 변경된 내용을 저장합니다.
    const updatedEnsemble =
      await this.recruitEnsembleRepo.save(recruitEnsemble);

    const savedAppliers = await this.applierEnsembleRepo
      .createQueryBuilder('applier')
      .innerJoinAndSelect('applier.user', 'user')
      .innerJoinAndSelect('applier.sessionEnsemble', 'sessionEnsemble')
      .innerJoin('applier.recruitEnsemble', 'recruitEnsemble')
      .where('recruitEnsemble.postId = :postId', { postId })
      .getMany();

    const ensembleRoom = await this.chatService.createRoom(
      recruitEnsemble.title,
      RoomType.GROUP,
      recruitEnsemble.user.id,
    );

    await Promise.all(
      savedAppliers.map(async (applier) => {
        await this.chatService.joinRoom(applier.user.id, ensembleRoom.id);
      }),
    );

    // 5. 업데이트된 게시물 정보를 DTO로 변환하여 반환합니다.
    const userResponse = UserResponseDto.from(updatedEnsemble.user);

    return RecruitEnsembleResponseDto.from(updatedEnsemble, userResponse);
  }

  async detailEnsemble(id: number): Promise<RecruitEnsembleResponseDto> {
    const ensemble = await this.recruitEnsembleRepo.findOne({
      where: { postId: id },
      relations: ['sessionEnsemble', 'applierEnsemble', 'user', 'location'],
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
        relations: ['sessionEnsemble', 'user', 'location'],
      });

      if (!ensemble) {
        throw new NotFoundException(`Ensemble with ID #${postId} not found.`);
      }

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
      const locationEntity = await this.locationRepo.findOneBy({
        locationId: Number(updateDto.locationId),
      });

      if (!locationEntity) {
        throw new NotFoundException(
          `Location with ID#${updateDto.locationId} not found.`,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sessionList, ...ensembleDto } = updateDto;

      const newEnsemble = this.recruitEnsembleRepo.create({
        ...updateDto,
        user: ensemble.user,
        recruitStatus: ensemble.recruitStatus,
        viewCount: ensemble.viewCount,
        location: locationEntity,
      });

      await queryRunner.manager.update(RecruitEnsemble, postId, newEnsemble);

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
