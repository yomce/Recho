import React from 'react';
import Icon from '@/components/atoms/icon/Icon';

interface NavItemProps {
  iconName: React.ComponentProps<typeof Icon>['name'];
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ iconName, label, active = false, onClick }) => {
    const activeClass = active ? 'text-brand-primary' : 'text-brand-gray group-hover:text-brand-primary';
    
    return (
      <div className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 transition-colors" onClick={onClick}>
        <Icon name={iconName} size={24} className={activeClass} />
        <span className={`text-xs font-medium ${activeClass}`}>{label}</span>
      </div>
    );
  };

interface MainFooterProps {
    currentPath: string;
    onHomeClick?: () => void;
    onCommunityClick?: () => void;
    onVinylClick?: () => void;
    onChatClick?: () => void;
    onMyPageClick?: () => void;
}

const MainFooter: React.FC<MainFooterProps> = ({ 
    currentPath,
    onHomeClick, 
    onCommunityClick, 
    onVinylClick, 
    onChatClick, 
    onMyPageClick 
  }) => {
    return (
        <footer 
          className="fixed bottom-0 left-1/2 z-10 h-18 w-full max-w-[430px] -translate-x-1/2 
                     flex items-center justify-around bg-brand-default"
        >
          {/* 👇 모든 active 조건을 올바르게 수정합니다. */}
          <NavItem iconName="home" label="홈" active={currentPath === '/main' || currentPath === '/'} onClick={onHomeClick} />
          <NavItem iconName="memo" label="커뮤니티" active={currentPath === '/category'} onClick={onCommunityClick} />   
          <NavItem iconName="vinyl" label="바이닐" active={currentPath.startsWith('/vinyl')} onClick={onVinylClick} />
          <NavItem iconName="chat" label="채팅" active={currentPath.startsWith('/chat')} onClick={onChatClick} />
          <NavItem iconName="user" label="마이" active={currentPath.startsWith('/users')} onClick={onMyPageClick} />
        </footer>
      );
    };

export default MainFooter;