// src/components/layout/MainHeader.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "../atoms/button/IconButton";
import NotificationIcon from './NotificationIcon';

// Header가 받을 props 타입을 정의
interface HeaderProps {
    currentPath: string;
    onCategoryClick?: () => void;
    onSearchClick?: () => void;
  }
  
  const MainHeader: React.FC<HeaderProps> = ({
    currentPath,
    onSearchClick,
  }) => {
    const navigate = useNavigate();
    
    const purePath = currentPath.split('?')[0];
    const isCategoryPage = purePath === '/category';

  const getTitle = () => {
    if (isCategoryPage) {
      return "카테고리";
    }
    // 기본 페이지에서는 로고나 다른 제목을 표시할 수 있습니다.
    // 예: return <img src="/logo.png" alt="Logo" className="h-6" />;
    return ""; // 기본 헤더는 제목 없음
  };

  return (
    <header
      className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[430px] -translate-x-1/2 
             flex items-center justify-between bg-brand-default px-4 w-full"
    >
      {/* 왼쪽 아이콘: 카테고리 페이지에서는 '뒤로가기' 버튼 표시 */}
      <div className="flex-shrink-0" style={{ width: "56px" }}>
        {isCategoryPage ? (
          <IconButton
            iconName="back"
            iconSize={24}
            onClick={() => navigate(-1)}
          />
        ) : (
          <div className="flex items-center justify-center ml-4">
            <img className="h-7" src="/vite.svg" alt="logo" />
            <span className="text-base font-semibold text-brand-text-primary ml-1">
              RECHO
            </span>
          </div>
        )}
      </div>

      {/* 중앙: 제목 또는 로고 */}
      <div className="flex-1 text-center text-base font-semibold text-brand-text-primary">
        {getTitle()}
      </div>

      {/* 오른쪽 아이콘들 */}
      <div
        className="flex flex-shrink-0 items-center justify-end gap-4"
        style={{ width: "56px" }}
      >
        <IconButton iconName="search" iconSize={24} onClick={onSearchClick} />
        <NotificationIcon />
      </div>
    </header>
  );
};

export default MainHeader;

