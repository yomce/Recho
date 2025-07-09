// src/components/layout/Header.tsx
import React from 'react';
import IconButton from '../atoms/button/IconButton';

// Header가 받을 props 타입을 정의
interface HeaderProps {
    currentPath: string;
    onCategoryClick?: () => void;
    onSearchClick?: () => void;
    onNotificationClick?: () => void;
  }
  
  const Header: React.FC<HeaderProps> = ({
    currentPath,
    onCategoryClick,
    onSearchClick,
    onNotificationClick,
  }) => {
    const isCategoryActive = currentPath === '/category';
    
    return (
    <header 
      className="fixed top-0 left-1/2 z-10 h-14 w-full max-w-[430px] -translate-x-1/2 
                 flex items-center justify-between bg-brand-default px-4"
    >
      <IconButton
        iconName="category"
        iconSize={24}
        onClick={onCategoryClick}
        className={isCategoryActive ? '!text-brand-primary' : ''}
      />

      <div className="flex items-center gap-4">
        <IconButton iconName="search" iconSize={24} onClick={onSearchClick} />
        <IconButton iconName="notification" iconSize={24} onClick={onNotificationClick} />
      </div>
    </header>
  );
};

export default Header;