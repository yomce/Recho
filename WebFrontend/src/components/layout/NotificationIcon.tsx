// src/components/layout/NotificationIcon.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import IconButton from '../atoms/button/IconButton';

const NotificationIcon: React.FC = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    // 클릭 시 알림 페이지로 이동
    navigate('/notifications');
  };

  return (
    <div className="relative">
      <IconButton iconName="notification" iconSize={24} onClick={handleClick} />
      {unreadCount > 0 && (
        <div 
          className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white 
                     flex items-center justify-center text-[10px] font-bold"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
