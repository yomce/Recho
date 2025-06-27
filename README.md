# 🎬 Video Editor Project

비디오 편집 및 합성 애플리케이션

## 🚀 팀원 시작하기

### 1. 초기 설정 (최초 1회)

```bash
git clone [repository-url]
cd [project-folder]
./setup.sh
```

### 2. 개발 시작

```bash
./dev.sh
```

### 3. Git Flow 사용

```bash
git flow feature start my-feature
# 개발 작업...
git flow feature finish my-feature
```

## 📁 구조

- **BackendServer** - NestJS API 서버 (포트 3000)
- **WebFrontend** - Vite React 웹앱 (포트 5173)
- **VideoEditorApp** - React Native 모바일앱 (별도 저장소)

## 🔧 환경변수

- 개발: `.env` (localhost)
- 배포: `.env.prod` (실제 도메인)

## 📖 가이드

- [초보자 배포 가이드](DEPLOYMENT-SIMPLE.md)
- [상세 배포 가이드](DEPLOYMENT.md)

## 🆘 문제 해결

- 환경변수 문제: `./setup.sh` 재실행
- 포트 충돌: 다른 포트 사용
- 의존성 문제: `npm install` 재실행
