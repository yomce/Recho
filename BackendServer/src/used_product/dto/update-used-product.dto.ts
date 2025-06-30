import { PartialType } from '@nestjs/mapped-types';
import { CreateUsedProductDto } from './create-used-product.dto';

export class UpdateUsedProductDto extends PartialType(CreateUsedProductDto) {}
