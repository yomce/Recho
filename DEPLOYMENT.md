# 배포 가이드

## 개별 서비스 배포

각 서비스를 별도 서버에 배포할 수 있도록 설정되어 있습니다.

### 1. Backend Server 배포

#### 환경 설정

```bash
cd BackendServer
cp env.prod.example .env.prod
# .env.prod 파일을 실제 값으로 수정
```

#### Docker 이미지 빌드

```bash
docker build -f Dockerfile.prod -t video-editor-backend:latest .
```

#### 서버에서 실행

```bash
docker run -d \
  --name video-editor-backend \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  video-editor-backend:latest
```

### 2. Frontend 배포

#### 환경 설정

```bash
cd WebFrontend
cp env.prod.example .env.prod
# .env.prod 파일을 실제 값으로 수정
```

#### Docker 이미지 빌드

```bash
docker build -f Dockerfile.prod -t video-editor-frontend:latest .
```

#### 서버에서 실행

```bash
docker run -d \
  --name video-editor-frontend \
  -p 80:80 \
  --env-file .env.prod \
  --restart unless-stopped \
  video-editor-frontend:latest
```

### 3. 배포 스크립트 사용

```bash
# Backend 배포
./deploy.sh backend production

# Frontend 배포
./deploy.sh frontend production
```

## 환경변수 설정

### Backend (.env.prod)

```bash
# 데이터베이스
DATABASE_URL=postgresql://username:password@your-db-host:5432/database_name

# AWS S3
AWS_ACCESS_KEY_ID=your_production_access_key_id
AWS_SECRET_ACCESS_KEY=your_production_secret_access_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-production-bucket-name

# 보안
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-domain.com
```

### Frontend (.env.prod)

```bash
# API 설정
VITE_API_URL=https://api.your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com/api

# 환경
VITE_ENV=production
VITE_DEBUG=false
```

## 보안 고려사항

1. **환경변수**: 절대 Git에 커밋하지 마세요
2. **SSL/TLS**: 프로덕션에서는 HTTPS 사용
3. **방화벽**: 필요한 포트만 열기
4. **백업**: 정기적인 데이터 백업
5. **모니터링**: 로그 및 헬스체크 설정

## 헬스체크

각 서비스는 헬스체크가 설정되어 있습니다:

- **Backend**: `http://your-domain:3000/health`
- **Frontend**: `http://your-domain/`

## 로그 확인

```bash
# Backend 로그
docker logs video-editor-backend

# Frontend 로그
docker logs video-editor-frontend
```
