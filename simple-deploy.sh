#!/bin/bash

echo "🎬 비디오 에디터 배포 도구"
echo "=========================="

# 1. 환경 선택
echo "어떤 환경에 배포하시겠습니까?"
echo "1) 개발 서버 (staging)"
echo "2) 실제 서버 (production)"
read -p "선택하세요 (1 또는 2): " env_choice

if [ "$env_choice" = "1" ]; then
    ENV="staging"
    echo "✅ 개발 서버에 배포합니다."
elif [ "$env_choice" = "2" ]; then
    ENV="production"
    echo "⚠️  실제 서버에 배포합니다. 주의하세요!"
else
    echo "❌ 잘못된 선택입니다."
    exit 1
fi

# 2. 서비스 선택
echo ""
echo "어떤 서비스를 배포하시겠습니까?"
echo "1) 백엔드 서버만"
echo "2) 프론트엔드만"
echo "3) 둘 다"
read -p "선택하세요 (1, 2, 또는 3): " service_choice

# 3. 배포 실행
case $service_choice in
    "1")
        echo "🚀 백엔드 서버 배포 중..."
        ./deploy.sh backend $ENV
        ;;
    "2")
        echo "🚀 프론트엔드 배포 중..."
        ./deploy.sh frontend $ENV
        ;;
    "3")
        echo "🚀 백엔드 서버 배포 중..."
        ./deploy.sh backend $ENV
        echo "🚀 프론트엔드 배포 중..."
        ./deploy.sh frontend $ENV
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🎉 배포가 완료되었습니다!"
echo ""
echo "💡 다음 단계:"
echo "   1. 서버에서 환경변수 파일(.env.prod) 수정"
echo "   2. Docker 컨테이너 실행"
echo "   3. 웹사이트 접속해서 테스트"
echo ""
echo "📖 자세한 가이드는 DEPLOYMENT.md 파일을 참고하세요." 