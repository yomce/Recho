import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeRoom } from './entities/practice-room.entity';
import { CreatePracticeRoomDto } from './dto/create-practice-room.dto';
import { UpdatePracticeRoomDto } from './dto/update-practice-room.dto';
import { PaginatedPracticeRoomResponse } from './dto/paginated-practice-room.response.dto';
import { Location } from 'src/map/entities/location.entity';
import { UserService } from 'src/auth/user/user.service';
import { plainToInstance } from 'class-transformer';
import { PracticeRoomResponseDto } from './dto/parctice-room.response.dto';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { ImageService } from 'src/image/image.service';

@Injectable()
export class PracticeRoomService {
  constructor(
    @InjectRepository(PracticeRoom)
    private readonly practiceRoomRepo: Repository<PracticeRoom>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,

    private readonly userService: UserService,
    private readonly imageService: ImageService,
  ) {}

  async findPracticeRoomWithPagination(
    limit: number,
    lastProductId?: number,
    lastCreatedAt?: Date,
  ): Promise<PaginatedPracticeRoomResponse> {
    const realLimit = limit + 1;
    const queryBuilder = this.practiceRoomRepo
      .createQueryBuilder('practiceRoom')
      .leftJoinAndSelect('practiceRoom.location', 'location')
      .leftJoinAndSelect('practiceRoom.user', 'user');

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

    const resultsResponse = await Promise.all(
      results.map(async (result) => {
        const tmpUserResponse = UserResponseDto.from(result.user);

        let userProfileSignedUrl: string | null = null;
        if (result.user && result.user.profileUrl) {
          userProfileSignedUrl = await this.imageService.getDownloadUrl(
            result.user.profileUrl,
          );
        }

        tmpUserResponse.profileImageUrl = userProfileSignedUrl;

        const tmpResultResponse = PracticeRoomResponseDto.from(
          result,
          tmpUserResponse,
        );
        return tmpResultResponse;
      }),
    );

    const hasNextPage = resultsResponse.length > limit;
    const data = hasNextPage
      ? resultsResponse.slice(0, limit)
      : resultsResponse;

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
  ): Promise<PracticeRoomResponseDto> {
    const { locationId, ...restofDto } = createDto;

    // TODO: 실제 프로젝트에서는 주입받은 locationRepo를 사용해 ID로 지역 정보를 조회해야 합니다.

    const locationEntity = await this.locationRepo.findOneBy({
      locationId: Number(locationId),
    });

    if (!locationEntity) {
      throw new NotFoundException(`Location with ID #${locationId} not found.`);
    }

    const user = await this.userService.internalFindById(id);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const newPracticeRoom = this.practiceRoomRepo.create({
      ...restofDto,
      locationId: locationEntity.locationId,
      user: user, // 실제 유저 ID를 사용해야 합니다
      viewCount: 0,
    });

    const room = await this.practiceRoomRepo.save(newPracticeRoom);

    return plainToInstance(PracticeRoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async internalDetailPracticeRoom(id: number): Promise<PracticeRoom> {
    const post = await this.practiceRoomRepo.findOne({
      where: { postId: id },
      relations: ['location', 'user'], // ← location 조인!
    });
    if (!post) {
      throw new NotFoundException(`Post withID #${id} not found`);
    }

    return post;
  }

  async publicDetailPracticeRoom(id: number): Promise<PracticeRoomResponseDto> {
    const post = await this.practiceRoomRepo.findOne({
      where: { postId: id },
      relations: ['location', 'user'], // ← location 조인!
    });
    if (!post) {
      throw new NotFoundException(`Post withID #${id} not found`);
    }

    const userResponse = UserResponseDto.from(post.user);

    let userProfileSignedUrl: string | null = null;
    if (post.user && post.user.profileUrl) {
      userProfileSignedUrl = await this.imageService.getDownloadUrl(
        post.user.profileUrl,
      );
    }

    userResponse.profileImageUrl = userProfileSignedUrl;

    const practiceRoomResponse = PracticeRoomResponseDto.from(
      post,
      userResponse,
    );

    return practiceRoomResponse;
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
  ): Promise<PracticeRoomResponseDto> {
    const post = await this.internalDetailPracticeRoom(id);
    const updatedPost = this.practiceRoomRepo.merge(post, updateDto);
    const savedPost = await this.practiceRoomRepo.save(updatedPost);

    const userResponse = UserResponseDto.from(post.user);
    const practiceRoomResponse = PracticeRoomResponseDto.from(
      savedPost,
      userResponse,
    );

    return practiceRoomResponse;
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.practiceRoomRepo.increment({ postId: id }, 'viewCount', 1);
  }
}
