import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // 오버레이가 열릴 때 input에 자동으로 포커스 되도록 설정
  useEffect(() => {
    if (isOpen) {
      const inputElement = document.getElementById('user-search-input');
      inputElement?.focus();
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('검색할 사용자 ID를 입력해주세요.');
      return;
    }
    navigate(`/users/${query}`);
    onClose(); // 검색 후 오버레이 닫기
    setQuery(''); // 입력창 초기화
  };

  if (!isOpen) {
    return null;
  }

  return (
    // 오버레이 الخلفية (Backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      {/* 검색창 컨텐츠 */}
      <div className="w-full max-w-sm rounded-lg bg-white p-6">
        <h3 className="text-center text-title font-bold">사용자 검색</h3>
        <p className="mb-4 mt-1 text-center text-body text-brand-text-secondary">
          찾고 싶은 사용자의 ID를 입력하세요.
        </p>
        <form onSubmit={handleSearch}>
          <input
            id="user-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="사용자 ID"
            className="w-full rounded-md border border-gray-300 p-3 text-center"
          />
          <div className="mt-6 flex flex-col gap-3">
            <PrimaryButton type="submit">검색하기</PrimaryButton>
            <SecondaryButton type="button" onClick={onClose}>
              취소
            </SecondaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchOverlay;