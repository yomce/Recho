// 숏폼 스크롤에서 보여줄 비디오 정보 조회용 DTO
import { IsNumber } from 'class-validator';

export class GetVideoDto {
  @IsNumber()
  video_id: number;
  // INSERT_YOUR_REWRITE_HERE

  //뎁스와 부모 아이디를 가져온다. (버튼 누를 시 비디오 아이디 기준으로 조회)
}

// 편집 들어간다.
// 비디오 비디오 아이디를 부모아이디로 저장
// 뎁스를 보고
// 뎁스만큼 for 문을 돌아서 부모 아이디와 소스 영상을 가져온다.
// 여기서 소스 영상은 presigned url이다.
