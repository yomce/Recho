import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { PromotionService as PromotionService } from './promotion.service';
import { CreateManualPromotionDto } from './dto/create-manual-promotion.dto';
import { AuthGuard } from '@nestjs/passport';
import { DeletePromotionDto } from './dto/delete-promotion.dto';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  async getPromotions() {
    return this.promotionService.findAllPromotions();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createManualPromotion(@Body() createManualDto: CreateManualPromotionDto) {
    return this.promotionService.createManualPromotion(createManualDto);
  }

  @Post('batch-delete')
  @UseGuards(AuthGuard('jwt'))
  async deleteManyPromotions(
    @Body() deleteDto: DeletePromotionDto,
  ): Promise<void> {
    await this.promotionService.deleteManyPromotions(deleteDto.ids);
  }
}
