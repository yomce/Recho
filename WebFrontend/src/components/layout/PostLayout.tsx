// src/components/layout/PostLayout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore'; // Auth 스토어 import
import PostHeader from './PostHeader';
import MainFooter from './MainFooter';

interface LayoutProps {
  children: React.ReactNode;
  bgClassName?: string;
  onSearchClick?: () => void;
  totalUnreadCount?: number;
}

const PostLayout: React.FC<LayoutProps> = ({ children, bgClassName = "bg-brand-frame", onSearchClick, totalUnreadCount }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Footer에서 사용할 페이지 이동 함수들
  const handleGoToHome = () => navigate('/');
  const handleGoToChat = () => navigate('/chat');
  const handleGoToVinyl = () => navigate('/vinyl');
  const handleGoToCommunity = () => navigate('/community');
  const handleGoToSearchPage = () => navigate('/search');
  
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
    <div className={`relative min-h-screen ${bgClassName}`}>
      <PostHeader   
        currentPath={location.pathname}
        onCategoryClick={handleGoToCategory}
        onSearchClick={onSearchClick || handleGoToSearchPage} 
      />
      <main className="py-14 pb-20">
        {children}
      </main>
      <MainFooter 
        currentPath={location.pathname}
        onHomeClick={handleGoToHome}
        onCommunityClick={handleGoToCommunity}
        onVinylClick={handleGoToVinyl}
        onChatClick={handleGoToChat}
        onMyPageClick={handleGoToMyPage}
        totalUnreadCount={totalUnreadCount}
      />
    </div>
  );
};

export default PostLayout;