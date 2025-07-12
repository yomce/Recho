// src/pages/RecruitEnsembleListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import PostLayout from '@/components/layout/PostLayout';
import SwiperTabs from '@/components/organisms/PostNavigationTabs';
import PostCard from '@/components/atoms/card/PostCard';
import FilterButton from '@/components/atoms/button/FilterButton';
import { toast } from 'react-hot-toast';
import FilterToast from '@/components/atoms/button/FilterToast';
import FloatingWriteButton from '@/components/atoms/button/FloatingWriteButton';

// 모집 공고 데이터 타입 (서버 응답 기준, 필요에 따라 수정)
interface RecruitEnsemble {
  // 기본 정보
  postId: number;
  title: string;
  content: string;
  id: string;

  // 날짜 정보 (API에서 문자열로 전달)
  createdAt: string;
  eventDate: string;

  // 상태 및 숫자 정보
  skillLevel: number;         // 0 (BEGINNER), 1 (INTERMEDIATE) 등
  recruitStatus: number;   // 0 (모집중) 등
  totalRecruitCnt: number;
  viewCount: number;
  
  // 다른 테이블과의 관계 ID
  locationId: number;
}

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
  const [items, setItems] = useState<RecruitEnsemble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const { user } = useAuthStore();

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

  const handleFilterClick = (tab: string) => {
    toast.custom((t) => (
      <FilterToast activeTab={tab} toastId={t.id} />
    ), {
      position: "bottom-center",
      duration: Infinity,
      id: "filter-toast",
    })
  }

  return (
    <PostLayout>
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
          contents={[items, [], []]}
          loading={loading}
          renderItem={(item) => (
            <PostCard
              key={item.postId}
              id={item.postId}
              title={item.title}
              eventDate={item.eventDate.slice(0,10)}
              recruitStatus={item.recruitStatus}
              totalRecruitCnt={item.totalRecruitCnt}
              cardClassName="h-[140px] items-center mt-2"
              textWrapperClassName="flex flex-col items-start justify-center w-full p-4 ml-2 gap-1"
              imagePosition="left"
              imageWrapperClassName="min-h-[140px] min-w-[140px] rounded-[20px]"
            />
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
    </PostLayout>
  );
};

export default RecruitEnsembleListPage;