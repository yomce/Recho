// src/pages/RecruitEnsembleListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import axiosInstance from '@/services/axiosInstance';
import PostLayout from '@/components/layout/PostLayout';
import SwiperTabs from '@/components/organisms/PostNavigationTabs';
import EnsembleCard from '@/components/layout/pages/ensemble/EnsembleCard';
import FilterButton from '@/components/atoms/button/FilterButton';
import FilterToast from '@/components/atoms/button/FilterToast';
import FloatingWriteButton from '@/components/atoms/button/FloatingWriteButton';
import type { RecruitEnsemble } from './types';
import { useEnsembleFilter, type EnsembleFilterParams } from '@/pages/ensemble/hooks/fetchFilteredEnsembleList';
import Modal from '@/components/molecules/modal/Modal';

// 모집 공고 데이터 타입은 '@/pages/ensemble/types'에서 import합니다.

// 페이지네이션 커서 타입
interface Cursor {
  lastPostId: number;
  lastCreatedAt: string;
}

// 페이지네이션 API 응답 타입
interface PaginatedEnsembleResponse {
  data: RecruitEnsemble[];
  nextCursor: Cursor | null;
  hasNextPage: boolean;
}

const RecruitEnsembleListPage: React.FC = () => {
  const { totalUnreadCount } = useChatStore();
  const [items, setItems] = useState<RecruitEnsemble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const { filteredData, fetchFilteredEnsembleList } = useEnsembleFilter();

  // --- 👇 1. Modal 상태 추가 ---
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('날짜'); // 어떤 필터를 눌렀는지 기억

  // --- 👇 2. 필터 적용 함수 수정 ---
  const handleFilterApply = (filters: EnsembleFilterParams) => {
    fetchFilteredEnsembleList(filters);
    setIsFiltered(true);
    setIsFilterModalOpen(false); // 필터 적용 후 Modal 닫기
  };

  const tabs = ['합주모집', '주변모임', '즐겨찾기'];
  
  const fetchItems = useCallback(async (isInitialFetch: boolean) => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '12' });
      // 커서 파라미터 이름을 API 사양에 맞게 변경 (lastId, lastCreatedAt)
      if (!isInitialFetch && nextCursor) {
        params.append('lastPostId', String(nextCursor.lastPostId));
        params.append('lastCreatedAt', nextCursor.lastCreatedAt);
      }

      // API 엔드포인트를 모집 공고 목록으로 변경
      const response = await axiosInstance.get<PaginatedEnsembleResponse>(
        `ensembles`,
        { params }
      );

      const { data, nextCursor: newCursor, hasNextPage: newHasNextPage } = response.data;

      setItems(prev => (isInitialFetch ? data : [...prev, ...data]));
      setNextCursor(newCursor ?? null);
      setHasNextPage(newHasNextPage);

    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('모집 공고 목록을 불러오는 데 실패했습니다.');
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, nextCursor]);

  useEffect(() => {
    fetchItems(true);
  }, []); // fetchItems가 useCallback으로 감싸져 있으므로 의존성 배열이 안전합니다.

  const handleLoadMore = () => {
    fetchItems(false);
  };

  // --- 👇 3. 필터 버튼 클릭 핸들러 수정 ---
  const handleFilterClick = (tab: string) => {
    setActiveFilterTab(tab); // 클릭한 탭 정보 저장
    setIsFilterModalOpen(true); // Modal 열기
  }

  return (
    <PostLayout totalUnreadCount={totalUnreadCount}>
      <div className="grid grid-cols-1 py-4">
        {/* --- 에러 메시지 --- */}
        {error && (
          <div className="flex justify-center items-center py-16 px-4 text-center">
            <p className="text-lg text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-4 px-4">
          <FilterButton 
            iconName="options" 
            iconClassName="rotate-90 text-brand-gray"
            onClick={() => handleFilterClick("날짜")}
          />
          <FilterButton label="날짜" onClick={() => handleFilterClick("날짜")}/>
          <FilterButton label="지역" onClick={() => handleFilterClick("지역")}/>
          <FilterButton label="악기" onClick={() => handleFilterClick("악기")}/>
          <FilterButton label="실력" onClick={() => handleFilterClick("실력")}/>
        </div>
        <SwiperTabs
          tabs={tabs}
          contents={[isFiltered ? filteredData : items, [], []]}
          loading={loading}
          renderItem={(item) => (
            <EnsembleCard posts={[item]} /> // 한 개짜리 배열로 넘겨도 문제 없음
          )}
        />
        {/* --- 로딩 스피너 --- */}
        {loading && (
          <div className="message-container">
            <div className="spinner"></div>
          </div>
        )}

        {/* --- 더보기 버튼 --- */}
        {!loading && hasNextPage && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={handleLoadMore}>
              더보기
            </button>
          </div>
        )}
      </div>
      <FloatingWriteButton />

      <Modal title='필터' isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)}>
        <FilterToast
          activeTab={activeFilterTab}
          onApplyFilter={handleFilterApply}
          onClose={() => setIsFilterModalOpen(false)} // 닫기 버튼을 위한 prop
        />
      </Modal>
    </PostLayout>
  );
};

export default RecruitEnsembleListPage;