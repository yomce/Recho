# Image-Upload 모듈 설명
이 디렉토리는 S3 Presigned URL 발급 및 이미지 업로드 등록과 관련된 백엔드 서버 로직을 담당합니다.

## BACKEND

### Presigned URL 발급 API
- **엔드포인트:** `POST /api/images/upload-urls`
- **요청 Body:**
  ```json
  {
    "items": [
    {
      "refIn": "USED-PRODUCTS",
      "fileType": "image/png"
    },
    {
      "refIn": "USED-PRODUCTS",
      "fileType": "image/jpeg"
    }
    ]
  }
  ```
- **응답:**
  ```json
  {
    "USED-PRODUCTS": {
    "url": "https://recho-img.s3.ap-northeast-2.amazonaws.com/your-bucket-path/uuid...",
    "key": "your-bucket-path/uuid..."
    } 
  } 
  ```
- **설명:**
  - 클라이언트는 업로드할 파일의 MIME 타입과 이미지 사용 위치(refIn)을 서버에 전달합니다.
  - 서버는 각 이미지에 대해 S3에 업로드할 수 있는 Presigned URL과 S3 key를 반환합니다
  - 클라이언트는 해당 URL로 직접 PUT 요청을 보내 S3에 이미지를 업로드 합니다.

### 이미지 메타데이터 저장 API
- **엔드포인트:** `POST /api/images`
- **요청 Body:**
  ```json
  {
    "images": [
      {
        "imageUrl": "https://recho-img.s3.ap-northeast-2.amazonaws.com/used-products/uuid...",
        "key": "used-products/uuid...",
        "refIn": "USED-PRODUCTS",
        "uploadOrder": 0,
        "refPostId": 123
      }
    ]
  }
  ```

### 주요 파일 설명

- `image.controller.ts` : Presigned URL 발급 및 이미지 메타데이터 저장 API
- `image.service.ts` : S3 URL 생성, key 검증, DB 저장 로직 담당

- `image-get-presigned-url.dto.ts` : Presigned URL 요청 시 사용하는 DTO (여러개의 URL 동시 발급 가능)
- `save-image.dto.ts` : 이미지 DB 저장에 사용하는 DTO

- `image.entity.ts` : 이미지 Entity 정의
- `image.types.ts` : refIn(ReferenceIn), UploadInfo 타입 정의

## FRONTEND

### 프론트엔드 전체 흐름
프론트엔드에서는 이미지 업로드 및 저장을 위해 다음 절차로 진행됩니다.

### Presigned URL 발급 요청
- **요청 방식:**
  ``` ts
  await axios.post('/api/images/upload-urls', {
      items: files.map(file => ({ refIn: 'USED-PRODUCTS', fileType: file.type }))
  });
  ```

### S3에 직접 이미지 업로드
- **요청 방식:**
  ``` ts
  await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  ```

### 메타데이터 DB 저장 요청
- **요청 방식:**
  ``` ts
  await axios.post('/api/images', {
    images: [
      {
        imageUrl: `https://recho-img.s3.ap-northeast-2.amazonaws.com/${key}`,
        key,
        refIn: 'USED-PRODUCTS',
        uploadOrder: 0,
        refPostId: 123  // 게시글 등록 후 받은 postId
      }
    ]
  });
  ```

### 주요 파일 설명

- `useImageUpload.ts` : Presigned URL을 요청하고, S3에 직접 이미지를 업로드하며, 해당 이미지의 메타데이터를 서버(DB)에 저장하는 모든 절차를 포함한 커스텀 훅입니다.
  - 주요 기능: 
    - `getPresignedUrl`: S3 업로드용 URL 및 key 발급 요청
    - `uploadToS3` : 발급받은 URL로 S3에 PUT 요청
    - `saveImgMetaData` : 업로드 완료된 이미지들의 정보를 서버에 전달하여 DB에 저장

- `ImageUploadPreview.tsx` : 사용자로부터 이미지를 입력받고, `useImageUpload` 훅을 통해 업로드 및 저장을 처리하는 UI 컴포넌트입니다.
  - props :
    - `refIn` : 해당 이미지가 속하는 게시판
    - `refPostId` : 게시글 ID (게시글 생성 이후 전달됨)
    - `maxImages` : 업로드 가능한 최대 이미지 개수

- 게시글 작성 폼에서 실제 게시글 데이터를 서버에 등록합니다. 이미지 업로드는 게시글 생성 전에 미리 처리한 후 게시판 테이블의 imageId와 Image 테이블의 refPostId를 매핑합니다.