import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';
import MyPageHeader from './UserPageHeader'; 
import MainFooter from './MainFooter';

interface MyPageLayoutProps {
  children: React.ReactNode;
  onSettingsClick?: () => void;
}

const MyPageLayout: React.FC<MyPageLayoutProps> = ({ children, onSettingsClick }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation(); 
  const user = useAuthStore((state) => state.user);
  
  const handleGoToMyPage = () => {
    if (user?.id) navigate(`/users/${user.id}`);
  };

  return (
    <div className="relative min-h-screen bg-brand-frame">
      <MyPageHeader onSettingsClick={onSettingsClick} />
      <main className="py-14 pb-20">
        {children}
      </main>
      <MainFooter 
        currentPath={pathname}
        onHomeClick={() => navigate('/main')}
        onCommunityClick={() => navigate('/category')}
        onVinylClick={() => navigate('/vinyl')}
        onChatClick={() => navigate('/chat')}
        onMyPageClick={handleGoToMyPage}
      />
    </div>
  );
};

export default MyPageLayout;