// src/services/socket.ts
import { io } from "socket.io-client";

// const SOCKET_URL = 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_API_URL;

// socket.io 클라이언트 인스턴스를 생성합니다.
// autoConnect: false 옵션은 필요할 때 수동으로 연결을 시작하도록 합니다.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  // auth 옵션을 추가하여 연결 시점에 토큰을 전송
  auth: (cb) => {
    const token = localStorage.getItem("accessToken");
    cb({ token });
  },
});
