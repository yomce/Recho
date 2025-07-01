# Gemini 작업 가이드: Recho 프로젝트 (자율 진행 모드)

**최종 업데이트:** 2025년 7월 1일

이 문서는 Recho 프로젝트의 목표와 최종적으로 합의된 개발 계획을 담고 있습니다. 자율 진행 중 방향성을 잃지 않기 위한 핵심 지침으로 사용됩니다.

## 1. 핵심 원칙

1.  **비디오 처리 주체:** 모든 FFmpeg을 사용한 비디오/썸네일 처리는 **100% 클라이언트(React Native 앱)**에서 이루어진다.
2.  **백엔드 역할:** 백엔드는 클라이언트가 처리한 결과물을 저장하고 조회하는 API 서버의 역할에만 집중한다. FFmpeg 관련 로직을 포함하지 않는다.
3.  **레거시 코드:** `videos` 모듈의 `createCollage` 관련 로직은 현재 프로젝트의 핵심 흐름과 무관하므로, **수정하거나 사용하지 않는다.** (삭제 보류)
4.  **스타일링:** 로직 구현에만 집중하며, 스타일 관련 코드는 수정하지 않는다.

## 2. 최종 구현 계획

### Task 1: DTO 및 엔티티 수정

-   [x] **`video.entity.ts`:** `source_video_url` -> `video_key`, `results_video_url` -> `video_key`, `thumbnail_url` -> `thumbnail_key`로 필드명 변경.
-   [x] **`save-video-meta.dto.ts`:** 클라이언트 중심 흐름에 맞게 DTO 필드를 수정. `source_video_url`, `results_video_url`을 `video_key`, `thumbnail_key` 등으로 명확하게 변경.

### Task 2: 비디오 업로드 로직 수정 (`video-insert` 모듈)

-   [x] **`video-insert.service.ts`:**
    -   기존에 잘못 추가했던 FFmpeg 후처리 로직을 **완전히 제거**.
    -   `getPresignedUrl` -> `getUploadUrls`로 변경. 여러 파일 정보(`[{fileType}]`)를 받아 각각에 맞는 Presigned URL과 S3 Key를 배열로 반환하도록 API 명세 수정.
    -   `saveVideoMeta` -> `saveFinalVideoMeta`로 역할 명확화. 클라이언트가 S3 업로드 후 전달한 `video_key`, `thumbnail_key`, `parent_video_id` 등을 받아 DB에 저장하는 단순한 로직으로 수정.
-   [x] **`video-insert.controller.ts`:** 서비스 변경에 맞춰 컨트롤러 엔드포인트 수정.

### Task 3: 비디오 조회 로직 구현 (`videos` 모듈)

-   [x] **`videos.module.ts`:** `TypeOrmModule.forFeature([Video])` 추가.
-   [x] **`videos.service.ts`:**
    -   `createCollage` 관련 레거시 코드는 무시하고, 하단에 새로운 메서드 구현.
    -   `getThumbnailsByUser(userId)`: 특정 유저의 모든 비디오 썸네일 URL(Presigned)을 배열로 반환.
    -   `getVideos(sortBy, limit, page)`: 좋아요순, 최신순 등으로 비디오 목록을 페이지네이션하여 조회. (결과물 비디오 URL은 Presigned로 제공)
    -   `getSourceVideoUrl(videoId)`: 리믹스를 위해 원본 비디오의 다운로드 URL(Presigned)을 제공.
-   [x] **`videos.controller.ts`:** 서비스 변경에 맞춰 컨트롤러 엔드포인트 수정.

### Task 4: 보고 및 기록

-   [x] **`IMPLEMENTATION_REPORT.md`:** 구현된 기능, 주요 변경 파일, 결정 사항 등을 상세히 기록.
-   [x] **`GEMINI.md`:** 5분 간격으로 현재 진행 상황 및 다음 계획을 업데이트.

## 3. 다음 작업 계획: `VideoEditorApp` (React Native) 구현

### Task 5: `VideoEditorApp` 비디오 편집 및 업로드 로직 구현

-   [x] **`react-native-webview` 설치 및 `WebScreen.tsx` 생성:** `WebFrontend`를 앱뷰로 띄우기 위한 기본 설정 완료.
-   [x] **내비게이션 통합:** `AppNavigator.tsx`에 `WebScreen`을 추가하고 초기 화면으로 설정.
-   [x] **원본 비디오 소스 로딩 (리믹스):**
    -   `GET /videos/source?videoId={id}` API를 사용하여 리믹스 시 부모 비디오의 원본 소스를 가져와 편집기에 로드하는 로직 구현.
-   [x] **Presigned URL 요청 및 S3 업로드:**
    -   백엔드의 `POST /video-insert/upload-urls` API를 사용하여 S3에 업로드할 Presigned URL을 요청.
    -   클라이언트에서 비디오 편집 및 썸네일 생성을 완료한 후, 받은 Presigned URL을 통해 S3에 최종 비디오와 썸네일을 직접 업로드.
-   [x] **최종 메타데이터 저장 요청:**
    -   S3 업로드 완료 후, 백엔드의 `POST /video-insert/complete` API를 사용하여 최종 비디오 메타데이터(S3 키, `parent_video_id`, `depth` 등)를 DB에 저장하도록 요청.
-   [x] **FFmpeg-kit-react-native 활용:**
    -   클라이언트 사이드에서 비디오 변환 (예: `webp` -> `mp4`) 및 썸네일 생성 로직 구현.

### Task 6: `WebFrontend` (React) 비디오 조회 및 스트리밍 로직 구현

-   [ ] **썸네일 목록 표시:** 백엔드의 `GET /videos/thumbnails?userId={id}` API를 사용하여 사용자 비디오 썸네일 목록을 표시.
-   [ ] **비디오 스트리밍:** 백엔드의 `GET /videos?sortBy={likes|date}&limit={num}&page={num}` API를 사용하여 비디오 목록을 조회하고 스트리밍.
-   [ ] **편집 트리거:** `WebFrontend`에서 비디오 편집 트리거 시, `VideoEditorApp`으로 `videoId`를 전달하는 로직 구현.

---

## 현재 진행 상황

-   **상태:** `VideoEditorApp`의 비디오 편집 및 업로드 로직 구현 완료.
-   **다음 작업:** `WebFrontend`의 비디오 조회 및 스트리밍 로직 구현.
