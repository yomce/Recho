// src/components/layout/MainLayout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore'; // Auth 스토어 import
import MainHeader from './MainHeader';
import MainFooter from './MainFooter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user); // user 정보 가져오기
  const location = useLocation();

  // Footer에서 사용할 페이지 이동 함수들
  const handleGoToHome = () => navigate('/');
  const handleGoToChat = () => navigate('/chat');
  const handleGoToVinyl = () => navigate('/vinyl');
  
  // '마이페이지' 이동 로직을 Layout이 직접 처리
  const handleGoToMyPage = () => {
    if (user?.id) {
      navigate(`/users/${user.id}`);
    } else {
      toast.error('로그인 정보가 없습니다.');
      navigate('/login');
    }
  };
  const handleGoToCategory = () => navigate('/category');

  return (
    <div className="relative min-h-screen bg-brand-frame">
      <MainHeader   
        currentPath={location.pathname}
        onCategoryClick={handleGoToCategory}
        onSearchClick={() => toast('준비 중입니다.')}
        onNotificationClick={() => toast('준비 중입니다.')}
      />
      <main className="py-14 pb-20">
        {children}
      </main>
      <MainFooter 
        currentPath={location.pathname}
        onHomeClick={handleGoToHome}
        onCommunityClick={() => toast('커뮤니티 페이지는 준비 중입니다.')}
        onVinylClick={handleGoToVinyl}
        onChatClick={handleGoToChat}
        onMyPageClick={handleGoToMyPage}
      />
    </div>
  );
};

export default Layout;