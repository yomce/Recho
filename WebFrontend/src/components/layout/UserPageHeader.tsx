import React from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '../atoms/button/IconButton';

interface MyPageHeaderProps {
  onSettingsClick?: () => void;
}

const MyPageHeader: React.FC<MyPageHeaderProps> = ({ onSettingsClick }) => {
  const navigate = useNavigate();

  return (
    <header 
      className="fixed top-0 left-1/2 z-10 h-14 w-full max-w-[430px] -translate-x-1/2 
                 flex items-center justify-between bg-brand-default px-4"
    >
      <IconButton iconName="back" onClick={() => navigate(-1)} />
      <h1 className="text-subheadline font-bold">프로필</h1>
      <IconButton iconName="settings" onClick={onSettingsClick} />
    </header>
  );
};

export default MyPageHeader;