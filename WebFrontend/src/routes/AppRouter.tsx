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
import ChatRoomPage from '../pages/chat/ChatRoomPage'; 
import UserPage from '../pages/user/UserPage';
import UsedProductPage from '../pages/usedProduct/UsedProductPage';
import CreateUsedProductPage from '../pages/usedProduct/CreateUsedProductPage';
import UsedProductDetailPage from '../pages/usedProduct/UsedProductDetailPage';
import UpdateUsedProductPage from '../pages/usedProduct/UpdateUsedProductPage';
import PracticeRoomPage from "@/pages/practiceRoom/PracticeRoomPage";
import CreatePracticeRoom from "@/pages/practiceRoom/CreatePracticeRoomPage";
import PracticeRoomDetailPage from "@/pages/practiceRoom/PracticeRoomDetailPage";
import UpdatePracticeRoomPage from "@/pages/practiceRoom/UpdatePracticeRoomPage";

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
        <Route path="/users/:userId" element={<UserPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/used-products" element={<UsedProductPage/>} />
        <Route path="/used-products/create" element={<CreateUsedProductPage/>} />
        <Route path="/used-products/:id" element={<UsedProductDetailPage />} /> 
        <Route path="/used-products/edit/:id" element={<UpdateUsedProductPage />} /> 
        <Route path="/practice-room" element={<PracticeRoomPage/>} />
        <Route path="/practice-room/create" element={<CreatePracticeRoom />} />
        <Route path="/practice-room/:id" element={<PracticeRoomDetailPage/>} />
        <Route path="/practice-room/edit/:id" element={<UpdatePracticeRoomPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
