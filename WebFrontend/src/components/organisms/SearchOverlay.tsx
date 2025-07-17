// WebFrontend/src/components/organisms/SearchOverlay.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';
import Modal from '@/components/molecules/modal/Modal';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 오버레이가 열릴 때 input에 자동으로 포커스 되도록 설정
    if (isOpen) {
      // Modal이 렌더링될 때까지 약간의 지연을 줄 수 있습니다.
      setTimeout(() => {
        const inputElement = document.getElementById('user-search-input');
        inputElement?.focus();
      }, 0);
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="사용자 검색"
    >
      {/* Modal의 children으로 검색 관련 UI를 전달합니다. */}
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
    </Modal>
  );
};

export default SearchOverlay;