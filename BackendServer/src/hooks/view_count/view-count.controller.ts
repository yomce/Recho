import {
  Controller,
  Post,
  Param,
  BadRequestException
} from '@nestjs/common';
import { ViewCountableType, ViewCountService } from './view-count.service';

@Controller('/api/count-view')
export class ViewCountController {
  constructor(private readonly viewCountService: ViewCountService) {}

  @Post(':type/:id')
  async countView(
    @Param('type') type: ViewCountableType,
    @Param('id') id: string,
  ) {
    const idNumber = Number(id);
    if(isNaN(idNumber)){
      throw new BadRequestException('Invalid ID');
    }
    console.log(`View count incremented for type=${type}, id=${id}`);
    return this.viewCountService.countView(type as ViewCountableType, idNumber);
  }
}