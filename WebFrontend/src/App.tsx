import React, { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import "./App.css";
import "./index.css";
import { useAuthStore } from "./stores/authStore";
import { useChatStore } from "./stores/chatStore"; 

function App() {
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const handleMessage = (event: any) => {
      try {
        const message = JSON.parse(event.data);

        // ReactNative로부터 오는 메시지인지 확인 (옵션)
        // if (event.origin !== '...') return;

        if (message.type === "SET_TOKEN" && message.token) {
          setToken(message.token);
          // 또는 직접 localStorage에 저장
          // localStorage.setItem('accessToken', message.token);
        }
      } catch (error) {
        // JSON 파싱 에러는 무시
      }
    };

    // web
    window.addEventListener("message", handleMessage);
    // react-native
    document.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("message", handleMessage);
    };
  }, [setToken]);

  useEffect(() => {
    // chatStore에서 소켓 초기화 함수를 가져와 실행합니다.
    const initializeChat = useChatStore.getState().initializeSocketListeners;
    initializeChat();
  }, []); // 빈 배열[]을 전달하여 앱이 처음 실행될 때 딱 한 번만 호출되도록 합니다.

  return (
    <div className="">
      <AppRouter />
    </div>
  );
}

export default App;
