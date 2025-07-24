import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsedProduct, STATUS as Status } from './entities/used-product.entity';
import { CreateUsedProductDto } from './dto/create-used-product.dto';
import { UpdateUsedProductDto } from './dto/update-used-product.dto';
import { PaginatedUsedProductResponse } from './dto/paginated-used-product.response.dto';
import { Location } from 'src/map/entities/location.entity';
import { ImageService } from 'src/image/image.service';
import { Image } from 'src/image/entities/image.entity';
import { UserService } from 'src/auth/user/user.service';
import { UsedProductResponseDto } from './dto/used-product.response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsedProductService {
  constructor(
    @InjectRepository(UsedProduct)
    private readonly usedProductRepo: Repository<UsedProduct>,
    private readonly userService: UserService,
    // TODO: 실제 프로젝트에서는 Location 엔티티의 Repository를 주입받아야 합니다.
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,

    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
    private readonly imageService: ImageService,
  ) {}

  async findUsedProductWithPagination(
    limit: number,
    lastProductId?: number,
    lastCreatedAt?: Date,
    categoryId?: number,
  ): Promise<PaginatedUsedProductResponse> {
    const realLimit = limit + 1;
    const queryBuilder = this.usedProductRepo.createQueryBuilder('usedProduct');

    if (lastProductId && lastCreatedAt) {
      const lastCreatedAtDate = new Date(lastCreatedAt);
      queryBuilder.where(
        '(usedProduct.createdAt < :lastCreatedAtDate) OR (usedProduct.createdAt = :lastCreatedAtDate AND usedProduct.productId < :lastProductId)',
        { lastCreatedAtDate, lastProductId },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('usedProduct.categoryId = :categoryId', {
        categoryId,
      });
    }

    const results = await queryBuilder
      .orderBy('usedProduct.createdAt', 'DESC')
      .addOrderBy('usedProduct.productId', 'DESC')
      .take(realLimit)
      .getMany();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;

    const lastItem = data[data.length - 1];
    const nextCursor =
      hasNextPage && lastItem
        ? {
            lastProductId: lastItem.productId,
            lastCreatedAt: lastItem.createdAt.toISOString(),
          }
        : undefined;

    // 대표 이미지 추출
    const productIds = data.map((p) => p.productId);

    // 참조하는 이미지가 없는 경우를 아래 쿼리를 실행하지 않음
    if (productIds.length === 0) return { data: [], nextCursor, hasNextPage };

    // 각 상품에 연결된 썸네일 이미지만 조회 (썸네일 플래그 + 경로 기반으로 이중 필터링)
    const thumbnails = await this.imageRepo
      .createQueryBuilder('image')
      .where('image.refPostId IN (:...productIds)', { productIds })
      .andWhere('image.isThumbnail = true')
      .andWhere("image.imageKey LIKE :pattern", { pattern: '%/thumbnail/%' })
      .getMany();

    // 썸네일 이미지에 대해 presigned URL을 발급하고, productId 기준으로 매핑
    const imageMap = new Map<number, string>();
    for (const img of thumbnails) {
      if (img.refPostId !== null && !imageMap.has(Number(img.refPostId))) {
        const signedUrl = await this.imageService.getDownloadUrl(img.imageKey); // presigned URL 생성
        imageMap.set(Number(img.refPostId), signedUrl); // 상품 ID → 썸네일 URL 매핑
      }
    }

    const dataWithThumbnails = data.map((product) => ({
      ...product,
      imageUrl: imageMap.get(product.productId) || null,
    }));

    // console.log('[쿼리 결과 Datawiththumbnails]', dataWithThumbnails);

    return {
      data: dataWithThumbnails,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollUsedProduct(
    createDto: CreateUsedProductDto,
    id: string,
  ): Promise<UsedProduct> {
    const { locationId, imageIds = [], ...restOfDto } = createDto;

    // 실제로 locationRepo를 사용해 ID로 지역 정보를 조회
    const locationEntity = await this.locationRepo.findOneBy({
      locationId: Number(locationId),
    });

    if (!locationEntity) {
      throw new NotFoundException(`Location with ID #${locationId} not found.`);
    }

    const user = await this.userService.internalFindById(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const newProduct = this.usedProductRepo.create({
      ...restOfDto,
      locationId: locationEntity.locationId,
      user: user,
      status: Status.FOR_SALE,
      viewCount: 0,
    });

    const savedProduct = await this.usedProductRepo.save(newProduct);

    // --- 이미지에 게시글 ID (refPostId) 매핑 ---
    if (imageIds.length > 0) {
      console.log('[이미지 매핑] 이미지 ID들:', imageIds);
      await this.imageService.connectImagesToPost({
        imageIds,
        refPostId: savedProduct.productId,
      });
    }

    return savedProduct;
  }

  async internalDetailProduct(
    productId: number,
  ): Promise<UsedProduct & { imageIds: number[] } & { imageUrl: string[] }> {
    const product = await this.usedProductRepo.findOne({
      where: { productId: productId },
      relations: ['user', 'location'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID #${productId} not found.`);
    }
    const images = await this.imageService.findImageByRefPostId(productId);
    const imageIds = images.map((img) => img.imageId);
    const imageUrl = images.map((img) => img.imageKey);
    return {
      ...product,
      imageIds,
      imageUrl,
    };
  }

  async publicDetailProduct(
    productId: number,
  ): Promise<
    UsedProductResponseDto & { imageIds: number[] } & { imageUrl: string[] }
  > {
    const product = await this.usedProductRepo.findOne({
      where: { productId: productId },
      relations: ['user', 'location'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID #${productId} not found.`);
    }
    // 모든 이미지 조회 (원본 + 썸네일 포함)
    const images = await this.imageService.findImageByRefPostId(productId);
    // 상세 페이지에서는 썸네일이 아닌 '원본 이미지'만 사용하므로 필터링
    const originalImages = images.filter((img) => !img.imageKey.includes('/thumbnail/'));
    const imageIds = originalImages.map((img) => img.imageId);

    // 원본 이미지에 대해 S3 presigned URL을 발급하여 클라이언트가 접근 가능하도록 처리
    const imageSignedUrls = await Promise.all(
      originalImages.map((img) => this.imageService.getDownloadUrl(img.imageKey))
    );

    let userProfileSignedUrl: string | null = null;
    if (product.user && product.user.profileUrl) {
      userProfileSignedUrl = await this.imageService.getDownloadUrl(
        product.user.profileUrl,
      );
    }

    const productDto = plainToInstance(UsedProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    console.log(productDto);

    if (productDto.user) {
      productDto.user.profileImageUrl = userProfileSignedUrl;
    }

    return {
      ...productDto,
      imageIds,
      imageUrl: imageSignedUrls,
    };
  }

  async deleteProduct(productId: number, id: string): Promise<void> {
    const product = await this.internalDetailProduct(productId);
    if (id !== product?.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.usedProductRepo.delete({ productId: productId });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID #${id} not found.`);
    }
  }

  async patchProduct(
    productId: number,
    updateDto: UpdateUsedProductDto,
    id: string,
  ): Promise<UsedProduct> {
    const product = await this.internalDetailProduct(productId);
    if (id !== product.user.id) {
      throw new ForbiddenException(`Unauthorized`);
    }

    // -- 장소를 수정할 수 있도록 변경합니다.
    // locationId가 있으면 Location 엔티티를 찾아서 연결
    let locationEntity = product.location;
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
      const allImages = await this.imageService.findImageByRefPostId(productId);
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
          refPostId: productId,
        });
      }
    }

    // 나머지 필드 병합
    const updatedProduct = this.usedProductRepo.merge(product, {
      ...updateDto,
      location: locationEntity,
      locationId: locationEntity?.locationId,
    });

    return this.usedProductRepo.save(updatedProduct);
  }

  // 참조하는 locationId를 반환합니다
  // locationService에서 호출되어 참조하지 않는 locatonId를 hard delete 합니다
  async getUsedLocationIds(): Promise<number[]> {
    const results = await this.usedProductRepo
      .createQueryBuilder('used')
      .select('DISTINCT used.locationId', 'locationId')
      .getRawMany();

    return results.map((row) => row.locationId);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.usedProductRepo.increment({ productId: id }, 'viewCount', 1);
  }

  async updateSalesStatus(productId: number, id: string, status: Status) {
    const product = await this.usedProductRepo.findOneBy({
      productId: productId,
    });
    if (!product)
      throw new NotFoundException(`Product with ID #${productId} not found.`);
    if (id !== product.user.id) throw new ForbiddenException(`Unauthorized`);

    product.status = status;
    return this.usedProductRepo.save(product);
  }

  async findUsedProductsByUserWithPagination(
    userId: string,
    limit: number,
    lastProductId?: number,
    lastCreatedAt?: Date,
    categoryId?: number,
  ): Promise<PaginatedUsedProductResponse> {
    const realLimit = limit + 1;
    const queryBuilder = this.usedProductRepo
      .createQueryBuilder('usedProduct')
      .leftJoinAndSelect('usedProduct.user', 'user')
      .leftJoinAndSelect('usedProduct.location', 'location')
      .where('user.id = :userId', { userId });

    if (lastProductId && lastCreatedAt) {
      queryBuilder.andWhere(
        '(usedProduct.createdAt < :lastCreatedAt) OR (usedProduct.createdAt = :lastCreatedAt AND usedProduct.productId < :lastProductId)',
        { lastCreatedAt, lastProductId },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('usedProduct.categoryId = :categoryId', { categoryId });
    }

    const results = await queryBuilder
      .orderBy('usedProduct.createdAt', 'DESC')
      .addOrderBy('usedProduct.productId', 'DESC')
      .take(realLimit)
      .getMany();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const lastItem = data[data.length - 1];
    const nextCursor =
      hasNextPage && lastItem
        ? {
            lastProductId: lastItem.productId,
            lastCreatedAt: lastItem.createdAt.toISOString(),
          }
        : undefined;

    const productIds = data.map((p) => p.productId);
    if (productIds.length === 0) return { data: [], nextCursor, hasNextPage };

    const thumbnails = await this.imageRepo
      .createQueryBuilder('image')
      .where('image.refPostId IN (:...productIds)', { productIds })
      .andWhere('image.isThumbnail = true')
      .andWhere("image.imageKey LIKE :pattern", { pattern: '%/thumbnail/%' })
      .getMany();

    const imageMap = new Map<number, string>();
    for (const img of thumbnails) {
      if (img.refPostId !== null && !imageMap.has(Number(img.refPostId))) {
        const signedUrl = await this.imageService.getDownloadUrl(img.imageKey); // presigned URL 생성
        imageMap.set(Number(img.refPostId), signedUrl); // 상품 ID → 썸네일 URL 매핑
      }
    }

    const dataWithThumbnails = data.map((product) => ({
      ...product,
      imageUrl: imageMap.get(product.productId) || null,
    }));

    return {
      data: dataWithThumbnails,
      nextCursor,
      hasNextPage,
    };
  }

}
