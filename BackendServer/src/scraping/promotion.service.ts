import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entity/promotion.entity';
import { CreateManualPromotionDto } from './dto/create-manual-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
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

  async createManualPromotion(
    createManualDto: CreateManualPromotionDto,
  ): Promise<Promotion> {
    try {
      const { title, imageUrl, subtitle } = createManualDto;

      const newPromotion = this.promotionRepository.create({
        title,
        imageUrl,
        subtitle: subtitle?.trim(),
      });

      return this.promotionRepository.save(newPromotion);
    } catch (error) {
      console.error('수동 프로모션 저장 중 오류:', error);
      throw new InternalServerErrorException(
        '데이터를 저장하는 중 오류가 발생했습니다.',
      );
    }
  }
}
