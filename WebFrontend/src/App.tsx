import React, { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import "./App.css";
import "./index.css";
import { useAuthStore } from "./stores/authStore";
import { useChatStore } from "./stores/chatStore";

function App() {
  const setToken = useAuthStore((state) => state.setToken);

  // 1. React Native 등 외부로부터 토큰을 받기 위한 useEffect (유지)
  useEffect(() => {
    const handleMessage = (event: any) => {
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
    document.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("message", handleMessage);
    };
  }, [setToken]);

  // 2. 채팅 소켓 연결 및 해제를 위한 useEffect (이 블록 하나만 사용)
  useEffect(() => {
    // chatStore에서 필요한 함수들을 가져옵니다.
    const { initializeSocketListeners, disconnectSocket } = useChatStore.getState();
    
    // 소켓 연결 및 리스너 등록
    initializeSocketListeners();

    // 컴포넌트가 사라질 때(cleanup) 소켓 연결을 끊습니다.
    return () => {
      disconnectSocket();
    };
  }, []); // 빈 배열[]: 앱이 처음 실행될 때 딱 한 번만 실행되도록 보장

  return (
    <div className="">
      <AppRouter />
    </div>
  );
}

export default App;