import { Controller, Post, Body, Get } from '@nestjs/common';
import { PromotionService as PromotionService } from './promotion.service';
import { CreateManualPromotionDto } from './dto/create-manual-promotion.dto';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  async getPromotions() {
    return this.promotionService.findAllPromotions();
  }

  @Post()
  createManualPromotion(@Body() createManualDto: CreateManualPromotionDto) {
    return this.promotionService.createManualPromotion(createManualDto);
  }
}
