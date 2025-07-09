import React from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '../atoms/button/IconButton';

interface HeaderProps {
  currentPath: string;
  onCategoryClick?: () => void;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
}

const PostHeader: React.FC<HeaderProps> = ({
  currentPath,
  onCategoryClick,
  onSearchClick,
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const isCategoryActive = currentPath === '/category';

  const purePath = currentPath.split('?')[0];
  const isMapViewPage = purePath.startsWith('/map-view');
  const isDetailOrCreatePage = /\/(create|\d+)$/.test(currentPath) || isMapViewPage;

  // 게시판 이름 매핑
  const getBoardTitle = () => {
    if (currentPath.startsWith('/used-products')) return '악기거래';
    if (currentPath.startsWith('/practice-room')) return '합주실예약';
    if (currentPath.startsWith('/ensembles')) return '세션모집';
    if (currentPath.startsWith('/vinyls')) return '바이닐';
    if (isMapViewPage) return '상세 지도';
    return '';
  };

  return (
    <header
      className="fixed top-0 left-1/2 z-10 h-14 w-full max-w-[430px] -translate-x-1/2 
             flex items-center justify-between bg-brand-default px-4"
    >
      {/* 왼쪽 아이콘 */}
      <div className="flex items-center justify-start" style={{ width: 56 }}>
        {isDetailOrCreatePage ? (
          <IconButton iconName="back" iconSize={24} onClick={() => navigate(-1)} />
        ) : (
          <IconButton
            iconName="category"
            iconSize={24}
            onClick={onCategoryClick}
            className={isCategoryActive ? '!text-brand-primary' : ''}
          />
        )}
      </div>

      {/* 중앙 텍스트 */}
      <div className="flex-1 text-center text-base font-semibold text-brand-text-primary">
        {getBoardTitle()}
      </div>

      {/* 오른쪽 아이콘들 */}
      <div className="flex items-center justify-end gap-4" style={{ width: 56 }}>
        <IconButton iconName="search" iconSize={24} onClick={onSearchClick} />
        <IconButton iconName="notification" iconSize={24} onClick={onNotificationClick} />
      </div>
    </header>
  );
};

export default PostHeader;
