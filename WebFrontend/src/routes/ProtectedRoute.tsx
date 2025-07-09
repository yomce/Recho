// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute: React.FC = () => {
  // 1. 상태를 객체로 묶지 않고, 각각 개별적으로 선택(select)합니다.
  //    이것이 무한 루프를 방지하는 가장 확실하고 안정적인 방법입니다.
  const isLoggedIn = useAuthStore((state) => !!state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // 2. 앱의 초기 인증 상태를 확인하는 동안에는 아무것도 렌더링하지 않고 기다립니다.
  if (isLoading) {
    return null; // 또는 로딩 스피너 컴포넌트를 보여줄 수 있습니다.
  }

  // 3. 로딩이 끝났는데도 로그인이 되어있지 않다면, 로그인 페이지로 보냅니다.
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 4. 로딩이 끝났고 로그인도 되어 있다면, 자식 라우트(요청한 페이지)를 안전하게 보여줍니다.
  return <Outlet />;
};

export default ProtectedRoute;
