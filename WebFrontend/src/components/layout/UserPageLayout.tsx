// src/components/layout/UserPageLayout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MyPageHeader from './UserPageHeader'; 
import MainFooter from './MainFooter';

interface MyPageLayoutProps {
  children: React.ReactNode;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  totalUnreadCount?: number;
}

const MyPageLayout: React.FC<MyPageLayoutProps> = ({ children, onSettingsClick, onSearchClick, totalUnreadCount }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation(); 
  const user = useAuthStore((state) => state.user);
  
  const handleGoToMyPage = () => {
    if (user?.id) navigate(`/users/${user.id}`);
  };

  return (
    <div className="relative min-h-screen bg-brand-frame">
      <MyPageHeader onSettingsClick={onSettingsClick} onSearchClick={onSearchClick} />
      <main className="py-14 pb-20">
        {children}
      </main>
      <MainFooter 
        currentPath={pathname}
        onHomeClick={() => navigate('/main')}
        onCommunityClick={() => navigate('/community')}
        onVinylClick={() => navigate('/vinyl')}
        onChatClick={() => navigate('/chat')}
        onMyPageClick={handleGoToMyPage}
        totalUnreadCount={totalUnreadCount}
      />
    </div>
  );
};

export default MyPageLayout;