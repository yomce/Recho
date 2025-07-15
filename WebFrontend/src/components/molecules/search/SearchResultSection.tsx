// WebFrontend/src/components/molecules/search/SearchResultSection.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResultSectionProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  morePath: string; // '더보기'를 눌렀을 때 이동할 경로
  keyword: string;
}

function SearchResultSection<T>({ title, items, renderItem, morePath, keyword }: SearchResultSectionProps<T>) {
  const navigate = useNavigate();
  // 3개만 보여주기 위해 배열을 자릅니다.
  const visibleItems = items.slice(0, 3);

  if (items.length === 0) return null; // 결과가 없으면 섹션 전체를 렌더링하지 않음

  const handleMoreClick = () => {
    navigate(`${morePath}?search=${keyword}`);
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text- text-brand-text-primary">{title}</h2>
        {/* 결과가 3개 초과일 때만 '더보기' 버튼 표시 */}
        {items.length > 3 && (
          <button onClick={handleMoreClick} className="cursor-pointer text-footnote font-semibold text-brand-primary">
          더보기
          </button>
        )}
      </div>
      <div className="divide-y divide-brand-frame rounded-[var(--radius-card)] border border-brand-frame bg-brand-default overflow-hidden">
        {visibleItems.map(renderItem)}
      </div>
    </section>
  );
}

export default SearchResultSection;