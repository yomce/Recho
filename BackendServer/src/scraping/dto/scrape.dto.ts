import { IsUrl } from 'class-validator';

export class ScrapeDto {
  @IsUrl({}, { message: '유효한 URL을 입력해주세요.' })
  url: string;
}
