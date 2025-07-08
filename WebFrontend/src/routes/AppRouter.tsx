// src/routes/AppRouter.tsx
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
import RecruitEnsembleListPage from "../pages/ensemble/RecruitEnsemblePage";
import CreateRecruitEnsemblePage from "../pages/ensemble/CreateRecruitEnsemblePage";
import RecruitEnsembleDetailPage from "../pages/ensemble/RecruitEnsembleDetailPage";
import VinylPage from "@/pages/vinyl/VinylPage";
import Navigation from "@/components/layout/Navigation";
import StyleGuideTest from "@/components/StyleGuideTest";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage";
import PracticeRoomPage from "@/pages/practiceRoom/PracticeRoomPage";
import CreatePracticeRoom from "@/pages/practiceRoom/CreatePracticeRoomPage";
import PracticeRoomDetailPage from "@/pages/practiceRoom/PracticeRoomDetailPage";
import UpdatePracticeRoomPage from "@/pages/practiceRoom/UpdatePracticeRoomPage";
import UpdateRecruitEnsemblePage from '@/pages/ensemble/UpdateRecruitEnsemblePage';
import MapViewPage from "@/pages/map/MapViewPage";
import ProtectedRoute from "./ProtectedRoute";
import CategoryPage from "@/pages/main/CategoryPage";

const AppRouter: React.FC = () => {
  return ( 
    <Router>
      <Routes>
        {/* 인증이 필요 없는 페이지들 */}
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* 인증이 필요한 페이지들 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/chat/:roomId" element={<ChatRoomPage />} />
          <Route path="/users/:id" element={<UserPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/vinyl" element={<VinylPage />} />
          <Route path="/used-products" element={<UsedProductPage />} />
          <Route path="/used-products/create" element={<CreateUsedProductPage />} />
          <Route path="/used-products/:id" element={<UsedProductDetailPage />} />
          <Route path="/used-products/edit/:id" element={<UpdateUsedProductPage />} />
          <Route path="/ensembles" element={<RecruitEnsembleListPage />} />
          <Route path="/ensembles/create" element={<CreateRecruitEnsemblePage />} />
          <Route path="/ensembles/edit/:id" element={<UpdateRecruitEnsemblePage />} />
          <Route path="/ensembles/:id" element={<RecruitEnsembleDetailPage />} />
          <Route path="/practice-room" element={<PracticeRoomPage />} />
          <Route path="/practice-room/create" element={<CreatePracticeRoom />} />
          <Route path="/practice-room/:id" element={<PracticeRoomDetailPage />} />
          <Route path="/practice-room/edit/:id" element={<UpdatePracticeRoomPage />} />
          <Route path="/map-view" element={<MapViewPage />} />
          <Route path="/style-guide" element={<StyleGuideTest />} />
        </Route>
      </Routes>
      <Navigation />
    </Router>
  );
};

export default AppRouter;