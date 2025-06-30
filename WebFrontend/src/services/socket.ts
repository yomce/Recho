// src/services/socket.ts
import { io } from 'socket.io-client';

// NestJS 백엔드 서버의 주소
const SOCKET_URL = 'http://localhost:3000';

// socket.io 클라이언트 인스턴스를 생성합니다.
// autoConnect: false 옵션은 필요할 때 수동으로 연결을 시작하도록 합니다.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
