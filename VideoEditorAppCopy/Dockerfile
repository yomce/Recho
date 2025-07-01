FROM node:20-alpine

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    git \
    bash \
    curl \
    python3 \
    make \
    g++

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# Metro bundler 포트 노출
EXPOSE 8081

# 개발 서버 시작
CMD ["npm", "start"] 