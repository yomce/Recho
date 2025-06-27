#!/bin/bash

echo "🛠️  개발 환경 시작"
echo "=================="

echo "어떤 환경으로 실행하시겠습니까?"
echo "1) Docker Compose (모든 서비스)"
echo "2) 개별 실행 (Backend만)"
echo "3) 개별 실행 (Frontend만)"
read -p "선택하세요 (1, 2, 또는 3): " choice

case $choice in
    "1")
        echo "🐳 Docker Compose로 모든 서비스 시작..."
        cd docker
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    "2")
        echo "🔧 Backend 서버만 시작..."
        cd BackendServer
        npm run start:dev
        ;;
    "3")
        echo "🎨 Frontend만 시작..."
        cd WebFrontend
        npm run dev
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac 