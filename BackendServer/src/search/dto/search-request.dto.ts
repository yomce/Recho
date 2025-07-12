import { IsNotEmpty, IsString } from 'class-validator';

export class SearchRequestDto {
  @IsString()
  @IsNotEmpty({ message: '검색어(keyword)는 비어 있을 수 없습니다.' })
  keyword: string;
}
