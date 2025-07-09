import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Inject,
  forwardRef,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'; // Logger 추가
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { In, Not, Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UsedProductService } from 'src/used_product/used-product.service';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios'; // Axios 에러 타입 가드 추가

@Injectable()
export class LocationService {
  private readonly KAKAO_MAP_REST_API_KEY: string;
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @Inject(forwardRef(() => UsedProductService))
    private readonly usedProductService: UsedProductService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('KAKAO_MAP_REST_API_KEY');

    if (!apiKey) {
      throw new Error(
        'KAKAO_MAP_REST_API_KEY is not defined in the configuration.',
      );
    }
    this.KAKAO_MAP_REST_API_KEY = apiKey;
  }

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const { lat, lng } = dto;
    const existingLocation = await this.locationRepo.findOne({
      where: { lat, lng },
    });
    if (existingLocation) {
      return existingLocation;
    }
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

  // --- 카카오 API 프록시 메서드 ---
  private getKakaoApiHeaders() {
    return { Authorization: `KakaoAK ${this.KAKAO_MAP_REST_API_KEY}` };
  }

  async searchByKeyword(query: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://dapi.kakao.com/v2/local/search/keyword.json',
          {
            params: { query },
            headers: this.getKakaoApiHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search by keyword', error);
      if (isAxiosError(error)) {
        // Axios 에러일 경우 더 구체적인 정보 로깅 가능
        this.logger.error('Axios error details:', error.response?.data);
      }
      throw new InternalServerErrorException('Failed to search by keyword');
    }
  }

  async reverseGeocode(x: string, y: string) {
    try {
      const response = await firstValueFrom(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.httpService.get(
          'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json',
          {
            params: { x, y },
            headers: this.getKakaoApiHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error) {
      // [수정 4] 안전한 에러 처리 및 로깅
      this.logger.error('Failed to reverse geocode', error);
      if (isAxiosError(error)) {
        this.logger.error('Axios error details:', error.response?.data);
      }
      throw new InternalServerErrorException('Failed to reverse geocode');
    }
  }
}
