import React, { useState, useEffect, useCallback } from "react";
import {
  type PracticeRoom,
  type PaginatedPracticeRoomResponse,
} from "@/types/practiceRoom";
import PostLayout from "@/components/layout/PostLayout";
import FloatingWriteButton from "@/components/atoms/button/FloatingWriteButton";
import ImageCard from "@/components/atoms/card/ImageCard";
import Icon from '@/components/atoms/icon/Icon'
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import PostCard from "@/components/atoms/card/PostCard";
import SwiperTabs from "@/components/organisms/PostNavigationTabs";
import axiosInstance from '@/services/axiosInstance';

interface Cursor {
  lastProductId: number;
  lastCreatedAt: string;
}

const PracticeRoomPage: React.FC = () => {
  const [post, setItems] = useState<PracticeRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 커서 기반 페이지네이션 상태 관리 ---
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

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
          `${apiUrl}/practice-room`,
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

  return (
    <PostLayout>
      <div className="relative">
        <ImageCard 
          src="https://placehold.co/390x314/F4EDFE/ffffff?text=.."
          width={430}
          className="rounded-b-[20px] border-1 border-white"
        />
        {/* Text Overlay */}
        <div className="absolute inset-0 w-full p-4 ml-4 flex flex-col gap-2 items-start justify-center">
          <div className="flex flex-row gap-2 items-center">
            <Icon name="mapPin" size={24} className="text-brand-gray"/>
            <span className="text-caption-bold text-brand-gray">4km</span>
          </div>
          <h2 className="text-headline text-brand-gray mb-1">정글합주실 용인 동백점</h2>
          <SecondaryButton
          style={{ backgroundColor: "#aaaaaa" }}
          >
            바로 이용하기
          </SecondaryButton>
        </div>
      </div>
      <div className="grid grid-cols-1 mb-[52px]">
        {error && (
          <div className="button-brand-gray mb-4">
            <p className="text-brand-error-text">{error}</p>
          </div>
        )}
        {/* SwiperTabs 내부에서 게시글을 렌더링합니다 */}
        <SwiperTabs
        tabs={tabs}
        contents={[post, [], []]}
        loading={loading}
        renderItem={(item) => (
          <PostCard
            key={item.postId}
            id={item.postId}
            title={item.title}
            address={item.location?.place_name || "주소 미제공"}
            textWrapperClassName="flex flex-col items-start justify-center w-full h-full gap-2 pl-16"
            imagePosition="left"
            imageWrapperClassName="min-w-[170px] rounded-l-[10px]"
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
    </PostLayout>
  );
};

export default PracticeRoomPage;
