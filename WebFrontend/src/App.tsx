// WebFrontend/src/App.tsx 

import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import "./App.css";
import "./index.css";
import { useAuthStore } from "./stores/authStore";
import { Toaster } from "react-hot-toast";
import { useChatStore } from "./stores/chatStore";
import { useConfigStore } from './stores/useConfigStore';
import axiosInstance from "./services/axiosInstance"; // ✨ axiosInstance import 추가

interface MyRoom { id: string; } // ✨ 간단한 타입 정의

function App() {
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const { user, actions: { setToken } } = useAuthStore(); // ✨ user 상태 가져오기
  const { initializeSocketListeners, disconnectSocket, fetchTotalUnreadCount } = useChatStore(); // ✨ chatStore 함수 가져오기

  // 환경변수 설정
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 1. React Native 등 외부로부터 토큰을 받기 위한 useEffect (유지)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "SET_TOKEN" && message.token) {
          setToken(message.token);
        }
      } catch (error) {
        // JSON 파싱 에러는 무시
      }
    };

    window.addEventListener("message", handleMessage);
    // document.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      // document.removeEventListener("message", handleMessage);
    };
  }, [setToken]);

  // ✨ 로그인 상태에 따라 소켓과 데이터를 관리하는 useEffect (이것 하나로 통합)
  useEffect(() => {
    if (user) {
      initializeSocketListeners();
      fetchTotalUnreadCount();

      // ✨ 소켓이 연결된 후에 실행될 로직
      const joinAllMyRooms = async () => {
        try {
          // 1. 내가 속한 모든 방 목록을 가져옵니다.
          const response = await axiosInstance.get<MyRoom[]>('chat/my-rooms');
          const myRooms = response.data;
          
          // 2. socket 인스턴스를 스토어에서 직접 가져옵니다.
          const chatSocket = useChatStore.getState().socket;

          if (chatSocket && myRooms.length > 0) {
            console.log('Joining all my rooms:', myRooms.map(r => r.id));
            // 3. 각 방에 대해 'joinRoom' 이벤트를 보냅니다.
            myRooms.forEach(room => {
              chatSocket.emit('joinRoom', { id: user.id, roomId: room.id });
            });
          }
        } catch (error) {
          console.error("Failed to fetch and join my rooms", error);
        }
      };

      // ✨ 소켓 연결이 확인되면 방 조인 로직을 실행
      // 'connect' 이벤트를 한 번만 수신하도록 `socket.once` 사용
      useChatStore.getState().socket.once('connect', joinAllMyRooms);
      
      return () => {
        // cleanup 시 리스너 제거
        useChatStore.getState().socket.off('connect', joinAllMyRooms);
        disconnectSocket();
      };
    }
  }, [user, initializeSocketListeners, disconnectSocket, fetchTotalUnreadCount]);

  return (
    <div className=""> 
    <Toaster position="top-center" />
    
    <AppRouter /> 
    </div>
  );
}

export default App;