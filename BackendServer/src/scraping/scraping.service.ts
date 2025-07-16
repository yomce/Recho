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
      // 💡 에러 로깅 강화
      console.error('--------------------------------');
      console.error(`Scraping failed for URL: ${url}`);

      if (error.isAxiosError) {
        // Axios 에러의 경우, 응답 상태와 데이터를 함께 로깅
        console.error(
          `AxiosError: Status ${error.response?.status} - ${error.message}`,
        );
        // 실제 멜론티켓이 보낸 에러 데이터도 확인
        console.error('Response Data:', error.response?.data);
      } else {
        // 그 외의 에러
        console.error('Non-Axios Error:', error.message);
      }
      console.error('--------------------------------');

      if (error instanceof BadRequestException) {
        throw error;
      }

      // 어떤 에러든 최종적으로는 InternalServerErrorException을 던짐
      throw new InternalServerErrorException(
        `데이터를 가져오는 중 오류가 발생했습니다. (URL: ${url})`,
      );
    }
  }
}
