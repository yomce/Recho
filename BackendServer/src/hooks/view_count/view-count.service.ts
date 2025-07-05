import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { EnsembleService } from "src/ensemble/ensemble.service";
import { PracticeRoomService } from "src/practice_room/practice-room.service";
import { UsedProductService } from "src/used_product/used-product.service";

export type ViewCountableType = 'practice-room' | 'used-products' | 'ensembles' ;

@Injectable()
export class ViewCountService {
  constructor(
    private readonly ensembleService: EnsembleService,
    private readonly practiceRoomService: PracticeRoomService,
    private readonly usedProductService: UsedProductService
  ) {}

  async countView (type: ViewCountableType, id: number) {
    switch(type){
      case 'ensembles':
        return this.ensembleService.incrementViewCount(id);
      case 'practice-room':
        return this.practiceRoomService.incrementViewCount(id);
      case 'used-products':
        return this.usedProductService.incrementViewCount(id);
      default:
        throw new BadRequestException('Unknow content type');
    }
  }
}