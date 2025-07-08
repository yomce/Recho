// src/components/layout/Footer.tsx
import React from 'react';
import Icon from '@/components/atoms/icon/Icon';

interface NavItemProps {
  iconName: React.ComponentProps<typeof Icon>['name'];
  label: string;
  active?: boolean;
  onClick?: () => void; // onClick 프롭 추가
}

const NavItem: React.FC<NavItemProps> = ({ iconName, label, active = false, onClick }) => {
    const activeClass = active ? 'text-brand-primary' : 'text-brand-gray group-hover:text-brand-primary';
    
    return (
      <div className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 transition-colors" onClick={onClick}>
        <Icon name={iconName} size={20} className={activeClass} />
        <span className={`text-footnote font-medium ${activeClass}`}>{label}</span>
      </div>
    );
  };

// Footer가 받을 함수들의 타입 정의
interface FooterProps {
    currentPath: string;
    onHomeClick?: () => void;
    onCommunityClick?: () => void;
    onVinylClick?: () => void;
    onChatClick?: () => void;
    onMyPageClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ 
    currentPath,
    onHomeClick, 
    onCommunityClick, 
    onVinylClick, 
    onChatClick, 
    onMyPageClick 
  }) => {
    return (
        <footer 
          className="fixed bottom-0 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 
                     flex items-center justify-around bg-brand-default h-18"
        >
          <NavItem iconName="home" label="홈" active={currentPath === '/main'} onClick={onHomeClick} />
          <NavItem iconName="memo" label="커뮤니티" active={currentPath === '/community'} onClick={onCommunityClick} />   
          <NavItem iconName="vinyl" label="바이닐" active={currentPath === '/vinyls'} onClick={onVinylClick} />
          <NavItem iconName="chat" label="채팅" active={currentPath === '/chat'} onClick={onChatClick} />
          <NavItem iconName="user" label="마이" active={currentPath === '/users/:id'} onClick={onMyPageClick} />
        </footer>
      );
    };

export default Footer;