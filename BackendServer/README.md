# Video Collage Backend Server

## API Documentation

### Presigned URL API

#### 1. 영상 업로드를 위한 Presigned URL 발급

**엔드포인트:** `POST /video-insert/upload-url`

**설명:** S3에 영상을 직접 업로드하기 위한 presigned URL을 발급받습니다.

**Request Body:**

```json
{
  "filename": "test-video.mp4",
  "fileType": "video/mp4"
}
```

**Response:**

```json
{
  "url": "presigned URL 주소",
  "key": "videos/2eee8707-024e-445b-bbbf-607a20c2ebdb"
}
```

**사용 예시:**

```javascript
// 1. Presigned URL 발급 요청
const response = await fetch('http://localhost:3000/video-insert/upload-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'my-video.mp4',
    fileType: 'video/mp4',
  }),
});

const { url, key } = await response.json();

// 2. S3에 직접 업로드 (5분 이내에 완료해야 함)
const uploadResponse = await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'video/mp4',
  },
  body: videoBlob, // 또는 File 객체
});

if (uploadResponse.ok) {
  console.log('업로드 성공! S3 key:', key);
}
```

**주의사항:**

- Presigned URL은 5분(300초) 동안만 유효합니다
- 업로드 완료 후 `key` 값을 저장하여 나중에 영상 메타데이터 저장 시 사용하세요
- Content-Type은 실제 파일 타입과 일치해야 합니다

---

## 숏폼 영상 편집/생성 로직 정리

### 1. 초기 생성(부모 없음)

- 편집 진입 시 별도의 GET 요청 필요 없음
- 클라이언트에서 바로 새 영상 편집 화면으로 진입
- depth는 1로 설정

### 2. 부모가 있는 경우(리믹스/편집)

- 편집 진입 시, parent_video_id를 기준으로 부모의 소스 영상을 찾아야 함
- depth가 1이라는 것은 부모가 한 명 있다는 뜻
- 반복문(혹은 재귀)으로 parent_video_id를 따라가며 부모의 소스 영상을 계속 조회
- 최상위 조상(부모가 없는 영상)까지의 모든 소스 영상을 찾아서 편집에 사용
- 이때 GET 요청을 통해 서버에서 parent_video_id로 소스 영상을 조회
- 스트리밍이 아니라 실제 소스 영상 파일(데이터)를 받아야 하며, S3 링크만 보여주는 것이 아님

### 3. 필요한 DTO

- GetSourceVideoDto
  ```typescript
  import { IsNumber } from 'class-validator';
  export class GetSourceVideoDto {
    @IsNumber()
    parent_video_id: number;
  }
  ```
- 이 DTO를 사용해 클라이언트가 서버에 GET/POST 요청을 보내고, 서버는 parent_video_id를 따라가며 최상위 소스 영상을 찾아 응답

### 4. API 예시

- 요청:
  ```
  GET /videos/source?parent_video_id=123
  ```
  또는
  ```
  POST /videos/source
  {
    "parent_video_id": 123
  }
  ```
- 응답:
  - 최상위 소스 영상의 실제 파일(혹은 파일 데이터)

# 정리

- 초기 생성: GET 필요 없음, depth=1
- 부모가 있는 경우: parent_video_id로 반복적으로 부모를 따라가며 소스 영상을 조회
- 편집용 소스: S3 링크만 보여주는 것이 아니라, 실제 소스 영상 파일을 클라이언트에 제공해야 함

## 프론트엔드에서 S3 Presigned URL과 Blob을 활용한 영상 편집 구조

- S3 Presigned URL로 영상 파일을 불러올 때, 브라우저(클라이언트)는 파일을 **blob(임시 메모리 객체)**으로 받습니다.
- 이 blob은 디바이스(로컬 저장소)에 저장되는 것이 아니라, **브라우저 메모리에서만 임시로 존재**합니다.
- blob을 활용해 영상 미리보기, 편집, 인코딩 등 다양한 작업을 할 수 있습니다.
- 편집/인코딩이 끝난 후, 결과물도 blob 형태로 만들어서 S3 Presigned URL로 바로 업로드(PUT)할 수 있습니다.
- 이 과정에서 사용자의 디바이스에는 파일이 저장되지 않으며, 모든 처리는 메모리상에서 이루어집니다.

### 예시 코드

```javascript
// Presigned URL로 영상 다운로드
const response = await fetch(presignedUrl);
const blob = await response.blob(); // 메모리상의 임시 데이터

// Blob을 <video> 태그에서 재생
const url = URL.createObjectURL(blob);
videoElement.src = url;

// 편집/인코딩 후 결과물을 다시 S3에 업로드
await fetch(uploadPresignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'video/mp4' },
  body: resultBlob,
});
```

### 정리

- blob은 "임시 메모리 객체"로, 디바이스에 저장되지 않음
- S3 Presigned URL로 다운로드/업로드 모두 blob을 활용
- 프론트엔드에서 안전하게 영상 편집/업로드가 가능

---
