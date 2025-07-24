import React from "react";
import Icon from "@/components/atoms/icon/Icon";

interface NavItemProps {
  iconName: React.ComponentProps<typeof Icon>["name"];
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  iconName,
  label,
  active = false,
  onClick,
}) => {
  const activeClass = active
    ? "text-black"
    : "text-brand-gray group-hover:text-black";

  return (
    <div
      className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 transition-colors"
      onClick={onClick}
      id={label}
    >
      <Icon name={iconName} size={28} className={activeClass} />
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
  totalUnreadCount?: number;
}

const MainFooter: React.FC<MainFooterProps> = ({
  currentPath,
  onHomeClick,
  onCommunityClick,
  onVinylClick,
  onChatClick,
  onMyPageClick,
  totalUnreadCount = 0,
}) => {
  return (
    <footer
      className="fixed bottom-0 left-1/2 z-10 h-20 w-full max-w-[430px] -translate-x-1/2 
                     flex items-center justify-around bg-brand-default border-t border-gray-200"
    >
      {/* 👇 모든 active 조건을 올바르게 수정합니다. */}
      <NavItem
        iconName="home"
        label="홈"
        active={currentPath === "/main" || currentPath === "/"}
        onClick={onHomeClick}
      />
      <NavItem
        iconName="memo"
        label="커뮤니티"
        active={currentPath === "/community"}
        onClick={onCommunityClick}
      />
      <NavItem
        iconName="vinyl"
        label="바이닐"
        active={currentPath.startsWith("/vinyl")}
        onClick={onVinylClick}
      />
      <div className="relative flex-1">
        <NavItem
          iconName="chat"
          label="채팅"
          active={currentPath.startsWith("/chat")}
          onClick={onChatClick}
        />
        {/* ✨ 여기에 배지 코드를 넣습니다. */}
        {totalUnreadCount > 0 && (
          <div 
            className="absolute top-1 right-[28%] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white pointer-events-none"
          >
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </div>
        )}
      </div>
      <NavItem
        iconName="user"
        label="마이"
        active={currentPath.startsWith("/users")}
        onClick={onMyPageClick}
      />
    </footer>
  );
};

export default MainFooter;
