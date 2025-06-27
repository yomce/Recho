#!/bin/bash

echo "🎬 Video Editor Project 초기 설정"
echo "================================"

# 1. Git Flow 설치 확인
if ! command -v git-flow &> /dev/null; then
    echo "⚠️  git-flow가 설치되어 있지 않습니다."
    echo "설치 방법:"
    echo "  macOS: brew install git-flow"
    echo "  Windows: https://github.com/petervanderdoes/gitflow-avh/wiki/Installation#windows"
    echo "  Linux: sudo apt-get install git-flow"
    echo ""
    read -p "git-flow를 설치한 후 Enter를 눌러주세요..."
fi

# 2. 환경변수 파일 생성
echo "📝 환경변수 파일 생성 중..."

# BackendServer
if [ ! -f "BackendServer/.env" ]; then
    cp BackendServer/env.example BackendServer/.env
    echo "✅ BackendServer/.env 생성됨"
else
    echo "ℹ️  BackendServer/.env 이미 존재함"
fi

# WebFrontend
if [ ! -f "WebFrontend/.env" ]; then
    cp WebFrontend/env.example WebFrontend/.env
    echo "✅ WebFrontend/.env 생성됨"
else
    echo "ℹ️  WebFrontend/.env 이미 존재함"
fi

# 3. 의존성 설치
echo "📦 의존성 설치 중..."

# BackendServer
echo "🔧 BackendServer 의존성 설치..."
cd BackendServer
npm install
cd ..

# WebFrontend
echo "🎨 WebFrontend 의존성 설치..."
cd WebFrontend
npm install
cd ..

echo ""
echo "🎉 초기 설정 완료!"
echo ""
echo "💡 다음 단계:"
echo "   1. 개발 시작: ./dev.sh"
echo "   2. Git Flow 사용: git flow feature start my-feature"
echo "   3. 자세한 가이드: README.md"
echo ""
echo "🚀 개발을 시작하세요!" 