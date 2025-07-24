import React, { useState, useEffect, useCallback } from "react";
import { useChatStore } from '../../stores/chatStore';
import {
  type PracticeRoom,
  type PaginatedPracticeRoomResponse,
} from "@/types/practiceRoom";
import PostLayout from "@/components/layout/PostLayout";
import FloatingWriteButton from "@/components/atoms/button/FloatingWriteButton";
import PostCard from "@/components/atoms/card/PostCard";
import SwiperTabs from "@/components/organisms/PostNavigationTabs";
import axiosInstance from "@/services/axiosInstance";
import FilterButton from "@/components/atoms/button/FilterButton";
import { usePracticeRoomFilter, type PracticeRoomFilterParams } from "@/pages/ensemble/hooks/fetchFilteredPracticeRoomList";
import FilterToast from '@/components/atoms/button/FilterToast';
import Modal from '@/components/molecules/modal/Modal';

// 커서 타입
interface Cursor {
  lastProductId: number;
  lastCreatedAt: string;
}

const PracticeRoomPage: React.FC = () => {
  const { totalUnreadCount } = useChatStore();
  const [post, setItems] = useState<PracticeRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 커서 기반 페이지네이션 상태 관리 ---
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [isFiltered, setIsFiltered] = useState(false);
  const { filteredData, fetchFilteredPracticeRoomList } = usePracticeRoomFilter();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('날짜'); // 어떤 필터를 눌렀는지 기억

  // --- 👇 2. 필터 적용 함수 수정 ---
  const handleFilterApply = (filters: PracticeRoomFilterParams) => {
    fetchFilteredPracticeRoomList(filters);
    setIsFiltered(true);
    setIsFilterModalOpen(false); // 필터 적용 후 Modal 닫기
  };
  // --- 탭 전환 ---
  const tabs = ['추천공간', '즐겨찾기', '검색결과'];
  // const tabContents: PracticeRoom[][] = [recommendations, bookmark, searchResults];

  // 데이터를 불러오는 함수
  const fetchItems = useCallback(
    async (isInitialFetch: boolean) => {
      // 로딩 중이거나 다음 페이지가 없으면 요청하지 않음
      if (loading || !hasNextPage) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: "12", // 한 번에 불러올 개수
        });

        // 첫 로드가 아닐 경우(더보기 클릭 시) 커서 파라미터를 추가
        if (!isInitialFetch && nextCursor) {
          params.append("lastProductId", String(nextCursor.lastProductId));
          params.append("lastCreatedAt", nextCursor.lastCreatedAt);
        }

        const response = await axiosInstance.get<PaginatedPracticeRoomResponse>(
          `practice-room`,
          { params }
        );

        const {
          data,
          nextCursor: newCursor,
          hasNextPage: newHasNextPage,
        } = response.data;

        // 첫 로드일 경우 데이터를 교체, 아닐 경우 기존 데이터에 새로운 데이터를 추가
        if (isInitialFetch) {
          setItems(data);
        } else {
          setItems((prevItems) => [...prevItems, ...data]);
        }

        setNextCursor(newCursor ?? null);
        setHasNextPage(newHasNextPage);
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setError("게시글 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [loading, hasNextPage, nextCursor]
  ); // useCallback 의존성 배열

  // 첫 마운트 시에만 데이터를 불러옵니다.
  useEffect(() => {
    fetchItems(true); // isInitialFetch = true
  }, []); // 의존성 배열이 비어있어 최초 1회만 실행됩니다.

  // '더보기' 버튼 클릭 핸들러
  const handleLoadMore = () => {
    fetchItems(false); // isInitialFetch = false
  };

  const handleFilterClick = (tab: string) => {
    setActiveFilterTab(tab); // 클릭한 탭 정보 저장
    setIsFilterModalOpen(true); // Modal 열기
  }

  return (
    <PostLayout totalUnreadCount={totalUnreadCount}>
      <div className="grid grid-cols-1 mb-[52px]">
        {error && (
          <div className="button-brand-gray mb-4">
            <p className="text-brand-error-text">{error}</p>
          </div>
        )}

        <div className="flex gap-2 p-4">
          <FilterButton 
            iconName="options" 
            iconClassName="rotate-90 text-brand-gray"
            onClick={() => handleFilterClick("지역")}
          />
          <FilterButton label="지역" onClick={() => handleFilterClick("지역")}/>
        </div>

        {/* SwiperTabs 내부에서 게시글을 렌더링합니다 */}
        <SwiperTabs
          tabs={tabs}
          contents={[isFiltered ? filteredData : post, [], []]}
          loading={loading}
          renderItem={(item) => (
            <PostCard
              key={item.postId}
              id={item.postId}
              title={item.title}
              address={item.location?.place_name || "주소 미제공"}
              imageUrl={item.imageUrl}
              textWrapperClassName="flex flex-col items-start justify-center w-full h-full gap-2 pl-16"
              imagePosition="left"
              imageWrapperClassName="min-w-[120px] rounded-l-[10px]"
              containerClassName="py-1 mt-2"
            />
          )}
        />

        {loading && (
          <div className="message-container">
            <div className="spinner"></div>
          </div>
        )}

        {!loading && hasNextPage && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={handleLoadMore}>
              더보기
            </button>
          </div>
        )}
      </div>
      <FloatingWriteButton />
      <Modal title='필터' isOpen={isFilterModalOpen} iconName='exit' onClose={() => setIsFilterModalOpen(false)}>
        <FilterToast
          activeTab={activeFilterTab}
          onApplyFilter={handleFilterApply}
          onClose={() => setIsFilterModalOpen(false)} // 닫기 버튼을 위한 prop
          showFilterSections={["지역"]}
        />
      </Modal>
    </PostLayout>
  );
};

export default PracticeRoomPage;
