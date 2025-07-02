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
import ChatRoomPage from "../pages/chat/ChatRoomPage";
import UserPage from "../pages/user/UserPage";
import UsedProductPage from "../pages/usedProduct/UsedProductPage";
import CreateUsedProductPage from "../pages/usedProduct/CreateUsedProductPage";
import UsedProductDetailPage from "../pages/usedProduct/UsedProductDetailPage";
import UpdateUsedProductPage from "../pages/usedProduct/UpdateUsedProductPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import RecruitEnsembleListPage from "@/pages/ensemble/RecruitEnsemblePage";
import CreateRecruitEnsemblePage from "@/pages/ensemble/CreateRecruitEnsemblePage";
import RecruitEnsembleDetailPage from "@/pages/ensemble/RecruitEnsembleDetailPage";
import VinylPage from "@/pages/vinyl/VinylPage";
import Navigation from "@/components/layout/Navigation";
import StyleGuideTest from "@/components/StyleGuideTest";

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 로그인 페이지로 설정 */}
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:roomId" element={<ChatRoomPage />} />
        <Route path="/users/:userId" element={<UserPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/vinyl" element={<VinylPage />} />
        <Route path="/used-products" element={<UsedProductPage />} />
        <Route path="/style-guide" element={<StyleGuideTest />} />
        <Route
          path="/used-products/create"
          element={<CreateUsedProductPage />}
        />
        <Route path="/used-products/:id" element={<UsedProductDetailPage />} />
        <Route
          path="/used-products/edit/:id"
          element={<UpdateUsedProductPage />}
        />
        <Route path="/ensembles" element={<RecruitEnsembleListPage />} />
        <Route
          path="/ensembles/create"
          element={<CreateRecruitEnsemblePage />}
        />
        <Route path="/ensembles/:id" element={<RecruitEnsembleDetailPage />} />
      </Routes>
      <Navigation />
    </Router>
  );
};

export default AppRouter;
