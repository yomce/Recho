FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# 개발 의존성도 설치 (nest CLI가 devDependencies에 있음)
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"] 