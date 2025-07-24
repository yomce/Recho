import React, { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { type UsedProduct, type PaginatedUsedProductResponse, CATEGORY_LABEL_TO_ID } from '../../types/product';
import axiosInstance from '@/services/axiosInstance';
import CategoryList from '@/components/layout/CategoryList';
import FloatingWriteButton from '@/components/atoms/button/FloatingWriteButton';
import PostLayout from '@/components/layout/PostLayout';
import PostCard from '@/components/atoms/card/PostCard';

interface Cursor {
  lastProductId: number;
  lastCreatedAt: string;
}

const UsedProductPage: React.FC = () => {
  const { totalUnreadCount } = useChatStore();
  const [items, setItems] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selected, setSelected] = useState<string>("전체");

  const fetchItems = useCallback(async (isInitialFetch: boolean) => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '12' });

      if(selected !== "전체") {
        const categoryId = CATEGORY_LABEL_TO_ID[selected];
        if(categoryId) {
          params.append("categoryId", String(categoryId));
        }
      }

      if (!isInitialFetch && nextCursor) {
        params.append('lastProductId', String(nextCursor.lastProductId));
        params.append('lastCreatedAt', nextCursor.lastCreatedAt);
      }

      const response = await axiosInstance.get<PaginatedUsedProductResponse>(
        `used-products`,
        { params }
      );

      const { data, nextCursor: newCursor, hasNextPage: newHasNextPage } = response.data;

      setItems(prev => (
        isInitialFetch 
        ? data 
        : [...prev, ...data.filter(item => !prev.some(p => p.productId === item.productId))]
      ));
      setNextCursor(newCursor ?? null);
      setHasNextPage(newHasNextPage);

    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('상품 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, nextCursor, selected]);

  useEffect(() => {
    fetchItems(true);
  }, [selected]);

  const handleLoadMore = () => {
    fetchItems(false);
  };

  const handleCategoryClick = (category: string) => {
    setSelected(category);
    setNextCursor(null);
    setHasNextPage(true);
    fetchItems(true);
  };

  return (
    <PostLayout totalUnreadCount={totalUnreadCount}>
      <div>
        <div className="relative w-full max-w-[410px] mx-auto min-h-screen bg-brand-frame">
          <div className="py-4 px-4">
            {/* 카테고리 */}
            <CategoryList
              selectedCategory={selected}
              onClickCategory={handleCategoryClick}
            />
              {/* 게시물 그리드 */}
            <div className="grid grid-cols-1 gap-[16px] max-w-[410px] mx-auto mt-[40px] mb-[52px]">
              {/* --- 에러 메시지 --- */}
              {error && (
                <div className="flex justify-center items-center">
                  <p className="text-body text-brand-error-text">{error}</p>
                </div>
              )}
              {/* 예시 카드 */}
              {items.length > 0 ? (
                items.map(item => (
                  <PostCard
                    key={item.productId}
                    id={item.productId}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    imageUrl={item.imageUrl}
                    imageWrapperClassName="rounded-r-[10px]"
                    cardClassName="bg-white"
                  />
                ))
              ) : (
                !loading && (
                  <div className="flex justify-center items-center text-body">
                    <p>등록된 상품이 없습니다.</p>
                  </div>
                )
              )}
              {/* --- 로딩 중 --- */}
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
          </div>
          <FloatingWriteButton />
        </div>  
      </div>
    </PostLayout>
  );
};

export default UsedProductPage;