// src/components/layout/UserPageHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '../atoms/button/IconButton';

interface MyPageHeaderProps {
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
}

const MyPageHeader: React.FC<MyPageHeaderProps> = ({ onSettingsClick, onSearchClick }) => {
  const navigate = useNavigate();

  return (
    <header 
      className="fixed top-0 left-1/2 z-10 h-14 w-full max-w-[430px] -translate-x-1/2 
                 flex items-center justify-between bg-brand-default px-4"
    >
      <div className="flex justify-start" style={{ width: '56px' }}>
        <IconButton iconName="back" onClick={() => navigate(-1)} />
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold text-brand-text-primary">프로필</h1>
      </div>
      {/* 아이콘들을 그룹으로 묶어 관리 용이성을 높입니다. */}
      <div className="flex items-center justify-end gap-2" style={{ width: '56px' }}>
        <IconButton iconName="search" onClick={onSearchClick} />
        <IconButton iconName="settings" onClick={onSettingsClick} />
      </div>
    </header>
  );
};

export default MyPageHeader;