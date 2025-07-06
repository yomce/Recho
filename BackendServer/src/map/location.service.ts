import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository, Not, In } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UsedProductService } from 'src/used_product/used-product.service';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @Inject(forwardRef(() => UsedProductService))
    private readonly usedProductService: UsedProductService,
  ) {}

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const { lat, lng } = dto;

    // 1. 동일한 위도/경도 값을 가진 location이 이미 있는지 확인
    const existingLocation = await this.locationRepo.findOne({
      where: { lat, lng },
    });

    // 2. 이미 있으면 해당 locationId 반환
    if (existingLocation) {
      return existingLocation;
    }

    // 3. 없다면 새로 생성
    const newLocation = this.locationRepo.create(dto);
    return await this.locationRepo.save(newLocation);
  }

  async findLocationById(id: number): Promise<Location | null> {
    return this.locationRepo.findOne({ where: { locationId: id } });
  }

  async cleanUpUnusedLocations() {
    const usedIds = [...(await this.usedProductService.getUsedLocationIds())];

    await this.locationRepo.delete({
      locationId: Not(In(usedIds.length ? usedIds : [0])),
    });
  }
}
