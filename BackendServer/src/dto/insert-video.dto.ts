import { IsNumber, IsString, IsOptional } from 'class-validator';

// 영상 업로드/등록용 DTO
export class InsertVideoDto {
  @IsOptional()
  @IsString()
  video_id?: string; // 서버에서 자동 생성, 클라이언트가 보내면 무시

  @IsNumber()
  user_id: number;

  //Parent_video_id가 null이 아닌 경우 depth만큼 부모를 찾아 올라가서 소스 영상을 가져와야함

  /**
   * (선택) 부모 영상에서 파생된 경우에만 사용
   * - 최초 생성 시에는 생략
   * - 부모 영상에서 편집/리믹스 시에만 포함
   */
  @IsOptional()
  @IsNumber()
  parent_video_id?: number;

  /**
   * - 최초 생성 시: 1
   * - 부모가 있을 때: 부모의 depth + 1
   */
  @IsNumber()
  depth: number;

  @IsString()
  source_video_url: string;

  @IsString()
  results_video_url: string;

  @IsString()
  thumbnail_url: string;

  @IsOptional()
  @IsNumber()
  like_count?: number;

  @IsOptional()
  @IsNumber()
  comment_count?: number;

  @IsOptional()
  created_at?: Date;
}
