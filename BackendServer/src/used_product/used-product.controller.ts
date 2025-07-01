import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsedProductService } from './used-product.service';
import { CreateUsedProductDto } from './dto/create-used-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateUsedProductDto } from './dto/update-used-product.dto';
import { UsedProduct } from './entities/used-product.entity';
// <<< 신규 DTO import
import { PaginatedUsedProductResponse } from './dto/paginated-used-product.response.dto';

@Controller('used-products')
export class UsedProductController {
  constructor(private readonly usedProductService: UsedProductService) {}
  private readonly logger = new Logger(UsedProductController.name);

  @Get()
  async getUsedProducts(
    @Query() paginationQuery: PaginationQueryDto,
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
  async enrollUsedProduct(
    @Body() createUsedProductDto: CreateUsedProductDto,
  ): Promise<UsedProduct> {
    this.logger.log(`Enrolling a new product: ${createUsedProductDto.title}`);
    return await this.usedProductService.enrollUsedProduct(
      createUsedProductDto,
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
  @HttpCode(204)
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting product ID: ${id}`);
    await this.usedProductService.deleteProduct(id);
  }

  @Patch(':id')
  // <<< 개선: 수정된 전체 상품 정보를 반환하도록 변경 (boolean -> UsedProduct)
  async pathProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsedProductDto: UpdateUsedProductDto,
  ): Promise<UsedProduct> {
    this.logger.log(`Patching product ID: ${id}`);
    return this.usedProductService.pathProduct(id, updateUsedProductDto);
  }
}
