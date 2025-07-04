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

@Injectable()
export class UsedProductService {
  constructor(
    @InjectRepository(UsedProduct)
    private readonly usedProductRepo: Repository<UsedProduct>,
    // TODO: 실제 프로젝트에서는 Location 엔티티의 Repository를 주입받아야 합니다.
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
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

    // 실제로 locationRepo를 사용해 ID로 지역 정보를 조회
    const locationEntity = await this.locationRepo.findOneBy({ locationId: Number(locationId) });

    if (!locationEntity) {
      throw new NotFoundException(`Location with ID #${locationId} not found.`);
    }
    /*
    // 임시로 location 객체를 생성합니다. (실제로는 위 주석처럼 DB에서 조회)
    const locationDataForDb = {
      location_id: locationEntity.locationId,
      region_level_1: locationEntity.region_level1, // 임시 데이터
      region_level_2: locationEntity.region_level2, // 임시 데이터
      address: locationEntity.address,
    };
    */

    const newProduct = this.usedProductRepo.create({
      ...restOfDto,
      locationId: locationEntity.locationId,
      userId: userId,
      status: Status.FOR_SALE,
      viewCount: 0,
    });
    return await this.usedProductRepo.save(newProduct);
  }

  async detailProduct(id: number): Promise<UsedProduct> {
    const product = await this.usedProductRepo.findOne({
      where: { productId: id },
      relations: ['location'],
    });
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

  async patchProduct(
    id: number,
    updateDto: UpdateUsedProductDto,
    username: string,
  ): Promise<UsedProduct> {
    const product = await this.detailProduct(id);
    if (username !== product.userId) {
      throw new ForbiddenException(`Unauthorized`);
    }

    // -- 장소를 수정할 수 있도록 변경합니다. 
    // locationId가 있으면 Location 엔티티를 찾아서 연결
    let locationEntity = product.location;
    if (updateDto.locationId) {
      const found = await this.locationRepo.findOneBy({ locationId: Number(updateDto.locationId) });
      if (!found) {
        throw new NotFoundException(`Location with ID #${updateDto.locationId} not found.`);
      }
      locationEntity = found;
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
  async getUsedLocationIds(): Promise<number []> {
    const results = await this.usedProductRepo
      .createQueryBuilder('used')
      .select('DISTINCT used.locationId', 'locationId')
      .getRawMany();
    
    return results.map(row => row.locationId);
  }
}
