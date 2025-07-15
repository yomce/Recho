// WebFrontend/src/components/molecules/search/RecentSearchChip.tsx

import React from 'react';
import Icon from '@/components/atoms/icon/Icon';

interface RecentSearchChipProps {
  term: string;
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
}

const RecentSearchChip: React.FC<RecentSearchChipProps> = ({ term, onSelect, onRemove }) => {
  // 삭제 이벤트가 다른 곳으로 전파되지 않도록 막습니다.
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(term);
  };

  return (
    <div 
      onClick={() => onSelect(term)}
      className="flex cursor-pointer items-center gap-1 rounded-full bg-brand-default px-3 py-1.5 text-caption text-brand-gray transition-colors hover:bg-gray-200"
    >
      <span>{term}</span>
      <button onClick={handleRemove} className="flex items-center justify-center">
        <Icon name="close" size={16} className="text-brand-disabled hover:text-brand-gray" />
      </button>
    </div>
  );
};

export default RecentSearchChip;