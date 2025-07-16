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
      // 실제 브라우저처럼 보이게 할 헤더 정보를 정의합니다.
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      };

      // httpService.get() 호출 시 두 번째 인자로 { headers } 객체를 전달합니다.
      const response = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
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
      // Axios 에러인 경우 상태 코드를 포함하여 더 자세한 에러를 던져줍니다.
      if (error.isAxiosError && error.response) {
        console.error(error.response.data);
        throw new InternalServerErrorException(
          `데이터를 가져오는 중 오류가 발생했습니다. (상태 코드: ${error.response.status})`,
        );
      }
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
