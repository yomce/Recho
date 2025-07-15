import { Controller, Post, Body, Get } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapeDto } from './dto/scrape.dto';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('promotions')
  async getPromotions() {
    return this.scrapingService.findAllPromotions();
  }

  @Post('promotion')
  async createPromotionData(@Body() scrapeDto: ScrapeDto) {
    return this.scrapingService.getPromotionDataFromUrl(scrapeDto.url);
  }
}
