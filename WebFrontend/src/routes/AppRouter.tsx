import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import MainPage from "../pages/main/MainPage";
import ChatListPage from "../pages/chat/ChatListPage";
import ChatRoomPage from '../pages/chat/ChatRoomPage'; // <-- 새로 만든 페이지 import


const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 로그인 페이지로 설정 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:roomId" element={<ChatRoomPage />} /> {/* <-- 새로운 동적 경로 추가 */}

        <Route path="/main" element={<MainPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
