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

@Injectable()
export class UsedProductService {
  constructor(
    @InjectRepository(UsedProduct)
    private readonly usedProductRepo: Repository<UsedProduct>,
    // TODO: 실제 프로젝트에서는 Location 엔티티의 Repository를 주입받아야 합니다.
    // @InjectRepository(Location)
    // private readonly locationRepo: Repository<Location>,
  ) {}

  async findUsedProductWithPagination(
    limit: number,
    lastProductId?: number,
    lastCreatedAt?: Date,
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

    return {
      data,
      nextCursor,
      hasNextPage,
    };
  }

  async enrollUsedProduct(
    createDto: CreateUsedProductDto,
    userId: string,
  ): Promise<UsedProduct> {
    const { locationId, ...restOfDto } = createDto;

    // TODO: 실제 프로젝트에서는 주입받은 locationRepo를 사용해 ID로 지역 정보를 조회해야 합니다.
    // const locationInfo = await this.locationRepo.findOneBy({ id: locationId });
    // if (!locationInfo) {
    //   throw new NotFoundException(`Location with ID #${locationId} not found.`);
    // }

    // 임시로 location 객체를 생성합니다. (실제로는 위 주석처럼 DB에서 조회)
    const locationDataForDb = {
      location_id: locationId,
      region_level_1: '경기도', // 임시 데이터
      region_level_2: '용인시', // 임시 데이터
    };

    const newProduct = this.usedProductRepo.create({
      ...restOfDto,
      location: locationDataForDb, // DB에 저장할 객체
      userId: userId, //
      status: Status.FOR_SALE,
      viewCount: 0,
    });
    return await this.usedProductRepo.save(newProduct);
  }

  async detailProduct(id: number): Promise<UsedProduct> {
    const product = await this.usedProductRepo.findOneBy({ productId: id });
    if (!product) {
      throw new NotFoundException(`Product with ID #${id} not found.`);
    }
    return product;
  }

  async deleteProduct(id: number, username: string): Promise<void> {
    const product = await this.detailProduct(id);
    if (username !== product?.userId) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const result = await this.usedProductRepo.delete({ productId: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID #${id} not found.`);
    }
  }

  async pathProduct(
    id: number,
    updateDto: UpdateUsedProductDto,
    username: string,
  ): Promise<UsedProduct> {
    const product = await this.detailProduct(id);
    if (username !== product.userId) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const updatedProduct = this.usedProductRepo.merge(product, updateDto);
    return this.usedProductRepo.save(updatedProduct);
  }
}
