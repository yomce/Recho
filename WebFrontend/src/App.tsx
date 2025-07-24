// WebFrontend/src/App.tsx 

import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import "./App.css";
import "./index.css";
import { useAuthStore } from "./stores/authStore";
import { Toaster } from "react-hot-toast";
import { useChatStore } from "./stores/chatStore";
import { useConfigStore } from './stores/useConfigStore';

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

  // ✨ 로그인 상태에 따라 소켓을 관리하는 useEffect (단순화)
  useEffect(() => {
    if (user) {
      // 소켓 리스너를 설정하고 연결을 시작합니다.
      initializeSocketListeners();
      // 앱이 로드될 때 전체 안 읽은 개수를 가져옵니다.
      fetchTotalUnreadCount();
      
      // 컴포넌트가 언마운트되거나 user가 변경될 때 소켓 연결을 끊습니다.
      return () => {
        disconnectSocket();
      };
    }
  // ✨ 의존성 배열에서 fetchTotalUnreadCount 제거 (함수 자체가 바뀌지 않으므로)
}, [user, initializeSocketListeners, disconnectSocket, fetchTotalUnreadCount]);

  return (
    <div className=""> 
      <Toaster position="top-center" />
      <AppRouter /> 
    </div>
  );
}

export default App;