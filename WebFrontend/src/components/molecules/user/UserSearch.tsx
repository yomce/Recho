import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';

const UserSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // form 제출 시 페이지가 새로고침 되는 것을 방지
    if (!searchQuery.trim()) {
      alert('검색할 사용자 ID를 입력해주세요.');
      return;
    }
    // 입력된 ID로 사용자 페이지 URL을 변경합니다.
    navigate(`/users/${searchQuery}`);
    setSearchQuery(''); // 검색 후 입력창을 비웁니다.
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xs gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="사용자 ID로 검색"
        className="flex-grow rounded-md border border-gray-300 p-2 text-sm"
      />
      <PrimaryButton type="submit" className="flex-shrink-0">
        검색
      </PrimaryButton>
    </form>
  );
};

export default UserSearch;