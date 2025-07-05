// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute: React.FC = () => {
  // .getState() 대신 hook을 사용하여 스토어의 변경 사항을 구독합니다.
  const user = useAuthStore((state) => state.user);

  // 만약 로그인 정보가 없다면, 로그인 페이지로 보냅니다.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 로그인 정보가 있다면, 요청한 페이지를 보여줍니다.
  return <Outlet />;
};

export default ProtectedRoute;