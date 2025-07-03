import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Location } from "./entities/location.entity";
import { Repository } from "typeorm";
import { CreateLocationDto } from "./dto/create-location.dto";

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepo.create(dto);
    return await this.locationRepo.save(location);
  }
}