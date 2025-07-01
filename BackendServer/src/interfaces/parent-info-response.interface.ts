/**
 * 직속 부모(1단계) 정보와 상위 조상들의 presigned URL 목록 응답 인터페이스
 */
export interface ParentInfoResponse {
  parent: {
    parent_video_id: number;
    depth: number;
    // 필요하다면 추가 정보 (예: 제목, 유저 등)
    source_video_presigned_url: string;
  };
  ancestors: string[]; // 상위 조상들의 presigned URL 배열 (최상위부터 순서대로)
}
