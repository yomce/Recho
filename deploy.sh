#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [service] [environment]

SERVICE=$1
ENVIRONMENT=$2

if [ -z "$SERVICE" ] || [ -z "$ENVIRONMENT" ]; then
    echo "사용법: ./deploy.sh [service] [environment]"
    echo "서비스: backend, frontend"
    echo "환경: staging, production"
    exit 1
fi

echo "🚀 $SERVICE를 $ENVIRONMENT 환경에 배포합니다..."

case $SERVICE in
    "backend")
        echo "📦 Backend 배포 중..."
        cd BackendServer
        
        # 환경변수 파일 복사
        if [ "$ENVIRONMENT" = "production" ]; then
            cp env.prod.example .env.prod
            echo "⚠️  .env.prod 파일을 실제 값으로 수정해주세요!"
        fi
        
        # Docker 이미지 빌드
        docker build -f Dockerfile.prod -t video-editor-backend:$ENVIRONMENT .
        
        echo "✅ Backend 배포 완료!"
        ;;
        
    "frontend")
        echo "📦 Frontend 배포 중..."
        cd WebFrontend
        
        # 환경변수 파일 복사
        if [ "$ENVIRONMENT" = "production" ]; then
            cp env.prod.example .env.prod
            echo "⚠️  .env.prod 파일을 실제 값으로 수정해주세요!"
        fi
        
        # Docker 이미지 빌드
        docker build -f Dockerfile.prod -t video-editor-frontend:$ENVIRONMENT .
        
        echo "✅ Frontend 배포 완료!"
        ;;
        
    *)
        echo "❌ 알 수 없는 서비스: $SERVICE"
        exit 1
        ;;
esac

echo "🎉 배포가 완료되었습니다!"
echo "💡 다음 단계:"
echo "   1. 환경변수 파일 수정"
echo "   2. Docker 이미지를 서버에 푸시"
echo "   3. 서버에서 컨테이너 실행" 