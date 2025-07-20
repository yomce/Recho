// src/entities/dto/used-product-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/auth/user/dto/user.response.dto';
import { Location } from 'src/map/entities/location.entity';

export class UsedProductResponseDto {
  @Expose()
  productId: number;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  price: number;

  @Expose()
  categoryId: number;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  locationId: number;

  @Expose()
  location: Location;

  @Expose()
  tradeType: string;

  @Expose()
  viewCount: number;
}
