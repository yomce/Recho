// BackendServer/src/search/search.controller.ts

import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchResponseDto } from './dto/search-response.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, stopAtFirstError: true }))
  searchByKeyword(
    @Query() query: SearchRequestDto,
  ): Promise<SearchResponseDto> {
    // 서비스의 search 함수를 호출하는 부분은 동일합니다.
    return this.searchService.search(query.keyword);
  }
}
