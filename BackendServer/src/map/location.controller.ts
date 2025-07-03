import { Body, Controller, Post } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location } from './entities/location.entity';

@Controller('/api/locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  async create(@Body() dto: CreateLocationDto): Promise<{ locationId: number }> {
    const location: Location = await this.locationService.createLocation(dto);
    return { locationId: location.locationId };
  }

}