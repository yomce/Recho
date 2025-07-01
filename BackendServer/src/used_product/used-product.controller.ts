import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsedProductService } from './used-product.service';
import { CreateUsedProductDto } from './dto/create-used-product.dto';
import { PaginationQueryUsedProductDto } from './dto/pagination-query-used-product.dto';
import { UpdateUsedProductDto } from './dto/update-used-product.dto';
import { UsedProduct } from './entities/used-product.entity';
import { PaginatedUsedProductResponse } from './dto/paginated-used-product.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('used-products')
export class UsedProductController {
  constructor(private readonly usedProductService: UsedProductService) {}
  private readonly logger = new Logger(UsedProductController.name);

  @Get()
  async getUsedProducts(
    @Query() paginationQuery: PaginationQueryUsedProductDto,
  ): Promise<PaginatedUsedProductResponse> {
    this.logger.log('Fetching used products with pagination');

    // <<< DTO의 변수명 변경에 맞춰 수정하고, limit 기본값 설정
    const { limit = 20, lastProductId, lastCreatedAt } = paginationQuery;

    return this.usedProductService.findUsedProductWithPagination(
      limit,
      lastProductId,
      lastCreatedAt,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async enrollUsedProduct(
    @Body() createUsedProductDto: CreateUsedProductDto,
    @Req() req: Request,
  ): Promise<UsedProduct> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id;

    this.logger.log(`Enrolling a new product: ${createUsedProductDto.title}`);
    return await this.usedProductService.enrollUsedProduct(
      createUsedProductDto,
      userId,
    );
  }

  @Get(':id')
  async detailProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsedProduct> {
    this.logger.log(`Fetching detail for product ID: ${id}`);
    return await this.usedProductService.detailProduct(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received delete request for product ID: ${id} from user ID: ${userId}`,
    );

    await this.usedProductService.deleteProduct(id, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async pathProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsedProductDto: UpdateUsedProductDto,
    @Req() req: Request,
  ): Promise<UsedProduct> {
    if (!req.user || !req.user.id) {
      this.logger.error(
        'Authentication information missing from request user object.',
      );
      throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    }
    const userId = req.user.id; // JwtStrategy에서 반환된 user.id 사용 가능
    this.logger.log(
      `Received patch request for product ID: ${id} from user ID: ${userId}`,
    );

    return this.usedProductService.pathProduct(
      id,
      updateUsedProductDto,
      userId,
    );
  }
}
