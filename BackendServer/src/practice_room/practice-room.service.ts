import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeRoom } from './entities/practice-room.entity';
import { CreatePracticeRoomDto } from './dto/create-practice-room.dto';
import { UpdatePracticeRoomDto } from './dto/update-practice-room.dto';
import { PaginatedPracticeRoomResponse } from './dto/paginated-practice-room.response.dto';
import { Location } from 'src/map/entities/location.entity';

@Injectable()
export class PracticeRoomService {
  constructor(
    @InjectRepository(PracticeRoom)
    private readonly practiceRoomRepo: Repository<PracticeRoom>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async findPracticeRoomWithPagination(
    limit: number,
    lastProductId?: number,
    lastCreatedAt?: Date,
  ): Promise<PaginatedPracticeRoomResponse> {
    const realLimit = limit + 1;
    const queryBuilder =
      this.practiceRoomRepo.createQueryBuilder('practiceRoom');

    if (lastProductId && lastCreatedAt) {
      const lastCreatedAtDate = new Date(lastCreatedAt);
      queryBuilder.where(
        '(practiceRoom.createdAt < :lastCreatedAtDate) OR (practiceRoom.createdAt = :lastCreatedAtDate AND practiceRoom.postId < :lastProductId)',
        { lastCreatedAtDate, lastProductId },
      );
    }

    const results = await queryBuilder
      .orderBy('practiceRoom.createdAt', 'DESC')
      .addOrderBy('practiceRoom.postId', 'DESC')
      .take(realLimit)
      .getMany();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;

    const lastItem = data[data.length - 1];
    const nextCursor =
      hasNextPage && lastItem
        ? {
            lastProductId: lastItem.postId,
            lastCreatedAt: lastItem.createdAt.toISOString(),
          }
        : undefined;

    return {
      data,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollPracticeRoom(
    createDto: CreatePracticeRoomDto,
    id: string,
  ): Promise<PracticeRoom> {
    const { locationId, ...restofDto } = createDto;

    // TODO: 실제 프로젝트에서는 주입받은 locationRepo를 사용해 ID로 지역 정보를 조회해야 합니다.

    const locationEntity = await this.locationRepo.findOneBy({
      locationId: Number(locationId),
    });

    if (!locationEntity) {
      throw new NotFoundException(`Location with ID #${locationId} not found.`);
    }

    const newPracticeRoom = this.practiceRoomRepo.create({
      ...restofDto,
      locationId: locationEntity.locationId,
      id: id, // 실제 유저 ID를 사용해야 합니다
      viewCount: 0,
    });
    return await this.practiceRoomRepo.save(newPracticeRoom);
  }

  async detailPracticeRoom(id: number): Promise<PracticeRoom> {
    const post = await this.practiceRoomRepo.findOne({
      where: { postId: id },
      relations: ['location'], // ← location 조인!
    });
    if (!post) {
      throw new NotFoundException(`Post withID #${id} not found`);
    }
    return post;
  }

  async deletePracticeRoom(id: number): Promise<void> {
    const post = await this.practiceRoomRepo.delete({ postId: id });
    if (post.affected === 0) {
      throw new NotFoundException(`Post withID #${id} not found`);
    }
  }

  async pathPracticeRoom(
    id: number,
    updateDto: UpdatePracticeRoomDto,
  ): Promise<PracticeRoom> {
    const post = await this.detailPracticeRoom(id);
    const updatedPost = this.practiceRoomRepo.merge(post, updateDto);
    return this.practiceRoomRepo.save(updatedPost);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.practiceRoomRepo.increment({ postId: id }, 'viewCount', 1);
  }
}
