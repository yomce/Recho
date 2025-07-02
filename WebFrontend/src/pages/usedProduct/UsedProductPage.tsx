import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { type UsedProduct, type PaginatedUsedProductResponse } from '../../types/product';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';

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
    <div className="max-w-6xl mx-auto my-8 px-4">
      {/* --- 페이지 헤더 --- */}
      <header className="flex justify-between items-center mb-8">
        <h2 className="m-0 text-3xl font-bold text-left">상품 목록</h2>
        { user && <Link 
          to="/used-products/create" 
          className="inline-block py-2.5 px-5 text-base font-semibold text-white bg-blue-500 rounded-md no-underline text-center transition-colors hover:bg-blue-700"
        >
          상품 등록하기
        </Link>}
      </header>

      {/* --- 에러 메시지 --- */}
      {error && (
        <div className="flex justify-center items-center py-16 px-4 text-center">
          <p className="text-lg text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* --- 상품 목록 그리드 --- */}
      {items.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
          {items.map((item) => (
            <Link
              key={`${item.productId}-${item.createdAt}`}
              to={`/used-products/${item.productId}`}
              className="block bg-white border border-gray-200 rounded-lg overflow-hidden no-underline text-slate-800 shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={item.imageUrl || 'https://placehold.co/600x400'} 
                  alt={item.title}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.title}
                </h3>
                <p className="text-xl font-semibold m-0">
                  {item.price.toLocaleString()}원
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- 상품 없음 메시지 --- */}
      {!loading && items.length === 0 && !error && (
        <div className="flex justify-center items-center py-16 px-4 text-center text-lg text-gray-600">
          <p>등록된 상품이 없습니다.</p>
        </div>
      )}

      {/* --- 로딩 스피너 --- */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="w-9 h-9 border-4 border-gray-200 border-l-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* --- 더보기 버튼 --- */}
      {!loading && hasNextPage && (
        <div className="text-center mt-12">
          <button
            onClick={handleLoadMore}
            className="py-3 px-8 text-lg font-semibold text-white bg-blue-500 rounded-md cursor-pointer transition-colors hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
};

export default UsedProductPage;