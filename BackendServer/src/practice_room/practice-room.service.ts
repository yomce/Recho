import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
import { Image } from 'src/image/entities/image.entity';
import { FilterPracticeRoomDto } from './dto/pagination-query-practice-room.dto';

@Injectable()
export class PracticeRoomService {
  constructor(
    @InjectRepository(PracticeRoom)
    private readonly practiceRoomRepo: Repository<PracticeRoom>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,

    private readonly userService: UserService,

    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
    private readonly imageService: ImageService,
  ) {}

  async findPracticeRoomWithPagination(
    filter: FilterPracticeRoomDto
  ): Promise<PaginatedPracticeRoomResponse> {
    const {
      limit = 20,
      lastProductId,
      lastCreatedAt,
      location,
    } = filter;
    const realLimit = limit + 1;
    const queryBuilder = this.practiceRoomRepo
      .createQueryBuilder('practiceRoom')
      .leftJoinAndSelect('practiceRoom.location', 'location')
      .leftJoinAndSelect('practiceRoom.user', 'user');

    // 🔍 지역 필터 조건 추가 (부분 일치)
    if (location) {
      if (location === '전라') {
        queryBuilder.andWhere(
          '(location.region_level1 LIKE :jeollaNorth OR location.region_level1 LIKE :jeollaSouth)',
          {
            jeollaNorth: `%전북%`,
            jeollaSouth: `%전라%`,
          },
        );
      } else {
        queryBuilder.andWhere('location.region_level1 LIKE :region', {
          region: `%${location}%`,
        });
      }
    }

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
    
    // ✅ 필터 조건에 따른 결과가 없을 때 바로 반환
    if (results.length === 0) {
      return {
        data: [],
        nextCursor: undefined,
        hasNextPage: false,
      };
    }

    const postIds = results.map((p) => p.postId);
    const thumbnails = await this.imageRepo
      .createQueryBuilder('image')
      .where('image.refPostId IN (:...postIds)', { postIds })
      .andWhere('image.isThumbnail = true')
      .andWhere("image.imageKey LIKE :pattern", { pattern: '%/thumbnail/%' })
      .getMany();

    const imageMap = new Map<number, string>();
    for (const img of thumbnails) {
      if (img.refPostId !== null && !imageMap.has(Number(img.refPostId))) {
        const signedUrl = await this.imageService.getDownloadUrl(img.imageKey);
        imageMap.set(Number(img.refPostId), signedUrl);
      }
    }

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


    const dataWithThumbnails = data.map((post) => ({
      ...post,
      imageUrl: imageMap.get(post.postId) || null,
    }));

    return {
      data : dataWithThumbnails,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollPracticeRoom(
    createDto: CreatePracticeRoomDto,
    id: string,
  ): Promise<PracticeRoomResponseDto> {
    const { locationId, imageIds = [], ...restofDto } = createDto;

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

    // --- 이미지에 게시글 ID (refPostId) 매핑 ---
    if (imageIds.length > 0) {
      console.log('[이미지 매핑] 이미지 ID들:', imageIds);
      await this.imageService.connectImagesToPost({
        imageIds,
        refPostId: room.postId,
      });
    }

    return plainToInstance(PracticeRoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async internalDetailPracticeRoom(
    postId: number
  ): Promise<PracticeRoom & { imageIds: number[] } & { imageUrl: string[] }> {
    const post = await this.practiceRoomRepo.findOne({
      where: { postId: postId },
      relations: ['location', 'user'], // ← location 조인!
    });
    if (!post) {
      throw new NotFoundException(`Post withID #${postId} not found`);
    }

    const images = await this.imageService.findImageByRefPostId(postId);
    const imageIds = images.map((img) => img.imageId);
    const imageUrl = images.map((img) => img.imageKey);
    return {
      ...post,
      imageIds,
      imageUrl,
    };
  }

  async publicDetailPracticeRoom(
    postId: number
  ): Promise<PracticeRoomResponseDto & { imageIds: number[] } & { imageUrl: string[] }> {
    const post = await this.practiceRoomRepo.findOne({
      where: { postId: postId },
      relations: ['location', 'user'], // ← location 조인!
    });
    if (!post) {
      throw new NotFoundException(`Post withID #${postId} not found`);
    }

    // 모든 이미지 조회 (원본 + 썸네일 포함)
    const images = await this.imageService.findImageByRefPostId(postId);
    // 상세 페이지에서는 썸네일이 아닌 '원본 이미지'만 사용하므로 필터링
    const originalImages = images.filter((img) => !img.imageKey.includes('/thumbnail/'));
    const imageIds = originalImages.map((img) => img.imageId);
    
    // 원본 이미지에 대해 S3 presigned URL을 발급하여 클라이언트가 접근 가능하도록 처리
    const imageSignedUrls = await Promise.all(
      originalImages.map((img) => this.imageService.getDownloadUrl(img.imageKey))
    );

    let userProfileSignedUrl: string | null = null;
    if (post.user?.profileUrl) {
      userProfileSignedUrl = await this.imageService.getDownloadUrl(post.user.profileUrl);
    }

    // user DTO 생성
    const userResponse = plainToInstance(UserResponseDto, post.user, {
      excludeExtraneousValues: true,
    });
    userResponse.profileImageUrl = userProfileSignedUrl;

    // PracticeRoom DTO 생성
    const resultDto = PracticeRoomResponseDto.from(post, userResponse);

    console.log(userResponse);

    return {
      ...resultDto,
      imageIds,
      imageUrl: imageSignedUrls,
    };
  }

  async deletePracticeRoom(postId: number, id: string): Promise<void> {
    const post = await this.internalDetailPracticeRoom(postId);
    if (id !== post?.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }
    const result = await this.practiceRoomRepo.delete({ postId: postId });
    if (result.affected === 0) {
      throw new NotFoundException(`Post withID #${id} not found`);
    }
  }

  async pathPracticeRoom(
    postId: number,
    updateDto: UpdatePracticeRoomDto,
    id: string,
  ): Promise<PracticeRoom> {
    const post = await this.internalDetailPracticeRoom(postId);
    if (id !== post.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }


    let locationEntity = post.location;
    if (updateDto.locationId) {
      const found = await this.locationRepo.findOneBy({
        locationId: Number(updateDto.locationId),
      });
      if (!found) {
        throw new NotFoundException(
          `Location with ID #${updateDto.locationId} not found.`,
        );
      }
      locationEntity = found;
    }
    
    // -- 이미지 수정 로직 추가
    if (updateDto.imageIds) {
      const allImages = await this.imageService.findImageByRefPostId(postId);
      const existingImageIds = allImages.map((img) => img.imageId);

      const toDisconnect = existingImageIds.filter(
        (id) => !updateDto.imageIds?.includes(id),
      );

      const toConnect = updateDto.imageIds;

      if (toDisconnect.length > 0) {
        await this.imageService.disconnectImages(toDisconnect);
      }

      if (toConnect.length > 0) {
        await this.imageService.connectImagesToPost({
          imageIds: toConnect,
          refPostId: postId,
        });
      }
    }

    const updatedPost = this.practiceRoomRepo.merge(post, {
      ...updateDto,
      location: locationEntity,
      locationId: locationEntity?.locationId,
    });

    return this.practiceRoomRepo.save(updatedPost);

    // const savedPost = await this.practiceRoomRepo.save(updatedPost);

    // const userResponse = UserResponseDto.from(savedPost.user);


    // const updatedPost = this.practiceRoomRepo.merge(post, updateDto);
    // const savedPost = await this.practiceRoomRepo.save(updatedPost);

    // const userResponse = UserResponseDto.from(post.user);
    // const practiceRoomResponse = PracticeRoomResponseDto.from(
    //   savedPost,
    //   userResponse,
    // );
  }

  async incrementViewCount(postId: number): Promise<void> {
    await this.practiceRoomRepo.increment({ postId: postId }, 'viewCount', 1);
  }
}
