// 유저 비디오 정보 조회용 DTO
import { IsNumber } from 'class-validator';

export class GetUserVideosDto {
  @IsNumber()
  user_id: number;
}
