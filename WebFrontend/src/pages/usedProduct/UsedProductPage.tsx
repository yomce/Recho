import React, { useState, useEffect, useCallback } from 'react';
import { type UsedProduct, type PaginatedUsedProductResponse } from '../../types/product';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import UsedProductCard from '@/components/atoms/card/UsedProductCard';
import CategoryList from '@/components/layout/CategoryList';
import ImageCard from '@/components/atoms/card/ImageCard';
import FloatingWriteButton from '@/components/atoms/button/FloatingWriteButton';
import Layout from '@/components/layout/MainLayout';
import PostLayout from '@/components/layout/PostLayout';

interface Cursor {
  lastProductId: number;
  lastCreatedAt: string;
}

const UsedProductPage: React.FC = () => {
  const [items, setItems] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selected, setSelected] = useState("전체");
  const { user } = useAuthStore();

  const fetchItems = useCallback(async (isInitialFetch: boolean) => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '12' });
      if (!isInitialFetch && nextCursor) {
        params.append('lastProductId', String(nextCursor.lastProductId));
        params.append('lastCreatedAt', nextCursor.lastCreatedAt);
      }

      const response = await axiosInstance.get<PaginatedUsedProductResponse>(
        `used-products`,
        { params }
      );

      const { data, nextCursor: newCursor, hasNextPage: newHasNextPage } = response.data;

      setItems(prev => (isInitialFetch ? data : [...prev, ...data]));
      setNextCursor(newCursor ?? null);
      setHasNextPage(newHasNextPage);

    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('상품 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, nextCursor]);

  useEffect(() => {
    fetchItems(true);
  }, [fetchItems]);

  const handleLoadMore = () => {
    fetchItems(false);
  };

  return (
    <PostLayout>
      <div>
        <div className="relative w-full max-w-[410px] mx-auto min-h-screen bg-brand-frame">
          <div className="py-4 px-16">
            <ImageCard src="https://placehold.co/398x270" />
            {/* 카테고리 */}
            <CategoryList
              selectedCategory={selected}
              onClickCategory={(c) => setSelected(c)}
            />
              {/* 게시물 그리드 */}
            <div className="grid grid-cols-1 gap-[16px] max-w-[410px] mx-auto mt-[40px]">
              {/* 예시 카드 */}
              {items.map(item => (
                <UsedProductCard
                  key={item.productId}
                  productId={item.productId}
                  title={item.title}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                />
              ))}

              {/* --- 에러 메시지 --- */}
              {error && (
                <div className="flex justify-center items-center">
                  <p className="text-body text-brand-error-text">{error}</p>
                </div>
              )}
              {/* --- 상품 없음 메시지 --- */}
              {!loading && items.length === 0 && !error && (
                <div className="flex justify-center items-center text-body">
                  <p>등록된 상품이 없습니다.</p>
                </div>
              )}
            </div>
            <FloatingWriteButton />
          </div>
        </div>  
      </div>
    </PostLayout>
  );
};

export default UsedProductPage;