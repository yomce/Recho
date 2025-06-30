# video-insert 모듈 설명

이 디렉토리는 **S3 Presigned URL 발급 및 영상 업로드 등록**과 관련된 서버 로직을 담당

---

## Presigned URL 발급 API

- **엔드포인트:** `POST /video-insert/upload-url`
- **요청 Body:**
  ```json
  {
    "filename": "example.mp4",
    "fileType": "video/mp4"
  }
  ```
- **응답:**
  ```json
  {
    "url": "https://s3.amazonaws.com/your-bucket/...",
    "key": "videos/uuid-..."
  }
  ```
- **설명:**
  - 클라이언트가 업로드할 파일의 타입(및 필요시 파일명)을 서버에 전달하면,
  - 서버는 S3에 업로드할 수 있는 Presigned URL과 S3 key를 반환함
  - 클라이언트는 이 URL로 S3에 직접 파일을 업로드함

---

## 주요 파일 설명

- `video-insert.controller.ts` : Presigned URL 발급 엔드포인트 제공함

- `video-insert.service.ts` : S3 Presigned URL 생성 로직 구현함
- `utils.ts` : (추후 유틸 함수 작성 시 사용 예정)

---

## 정리

- Presigned URL은 보안상 유효기간(예: 5분) 내에만 사용 가능함
- 업로드 완료 후, S3 key/URL 등 메타데이터를 별도 API로 서버에 전달해 DB에 저장해야 함
- .env의 AWS 관련 설정(AWS_REGION, AWS_S3_BUCKET 등)이 필요함

---

## 프론트엔드 전체 흐름 및 복잡성 안내

프론트엔드에서 영상 업로드 및 등록을 위해서는 다음과 같은 절차를 거침:

1. **Presigned URL 발급 요청**
   - 서버에 `POST /video-insert/upload-url`로 파일 타입(및 필요시 파일명)을 전달함
   - 서버로부터 S3에 업로드할 수 있는 presigned URL과 S3 key를 응답받음

2. **S3에 직접 파일 업로드**
   - 받은 presigned URL로 S3에 직접 PUT 요청하여 파일 업로드함
   - 이 과정에서 파일은 브라우저 메모리(blob)에서 바로 전송됨

3. **업로드 완료 후, 메타데이터 DB 저장 요청**
   - 서버에 `POST /video-insert/complete`로 user_id, source_video_url(S3 key), 기타 메타데이터를 전달함
   - 서버는 이 정보를 DB(PostgreSQL)에 저장함

---

### ⚠️ 프론트엔드 복잡성 주의

- Presigned URL 발급, S3 업로드, DB 저장까지 **여러 단계를 프론트에서 직접 관리**해야 하므로 로직이 복잡해질 수 있음
- 각 단계별로 에러 처리, 상태 관리, 업로드 진행 상황 표시 등 추가 구현이 필요함
- 업로드가 실패하거나 Presigned URL이 만료될 경우 재시도 로직도 고려해야 함
- 업로드 완료 후 DB 저장까지 반드시 성공해야 최종적으로 영상이 등록됨

---

### 전체 흐름 요약

1. Presigned URL 발급 → 2. S3 업로드 → 3. DB 저장

- 각 단계가 모두 성공해야 영상이 정상적으로 등록됨
- 프론트엔드에서 각 단계별로 상태/에러/진행 상황을 꼼꼼히 관리해야 함

---
