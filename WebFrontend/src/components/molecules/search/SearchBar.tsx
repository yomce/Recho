// WebFrontend/src/components/molecules/search/SearchBar.tsx

import React, { useState } from 'react';
import TextInput from '@/components/atoms/input/TextInput';
import Icon from '@/components/atoms/icon/Icon';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  initialKeyword?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, 
  initialKeyword = '', 
  className = '' }) => {
  const [keyword, setKeyword] = useState(initialKeyword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    onSearch(keyword);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <TextInput
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="관심 있는 내용을 검색해보세요"
        // ⭐️ 제공해주신 TextInput과 Icon 컴포넌트 사용
        icon={<Icon name="search" size={20} className="text-brand-gray" />}
      />
    </form>
  );
};

export default SearchBar;