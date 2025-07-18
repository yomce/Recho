import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location } from './entities/location.entity';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('search')
  search(@Query('query') query: string) {
    return this.locationService.searchByKeyword(query);
  }

  @Get('reverse-geocode')
  reverseGeocode(@Query('x') x: string, @Query('y') y: string) {
    return this.locationService.reverseGeocode(x, y);
  }

  @Post()
  async create(
    @Body() dto: CreateLocationDto,
  ): Promise<{ locationId: number }> {
    const location: Location = await this.locationService.createLocation(dto);
    return { locationId: location.locationId };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Location> {
    const location = await this.locationService.findLocationById(Number(id));
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }
}
