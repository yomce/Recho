import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import * as cheerio from 'cheerio';
import { Promotion } from './entity/promotion.entity';

@Injectable()
export class ScrapingService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  async findAllPromotions(): Promise<Promotion[]> {
    try {
      return this.promotionRepository.find({
        order: {
          id: 'DESC',
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        '데이터를 조회하는 중 오류가 발생했습니다.',
      );
    }
  }

  async getPromotionDataFromUrl(url: string): Promise<Promotion> {
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content');
      const imageUrl = $('meta[property="og:image"]').attr('content');
      const subtitle = $('dd#periodInfo').text();

      if (!title || !imageUrl || !subtitle) {
        throw new BadRequestException(
          '페이지에서 필요한 정보를 모두 찾을 수 없습니다.',
        );
      }

      const newPromotion = this.promotionRepository.create({
        title: title,
        imageUrl: imageUrl,
        subtitle: subtitle.trim(),
      });

      const savedPromotion = await this.promotionRepository.save(newPromotion);

      return savedPromotion;
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '데이터를 가져오고 저장하는 중 오류가 발생했습니다.',
      );
    }
  }
}
