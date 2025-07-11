// src/pages/RecruitEnsembleListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';

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
  lastId: number;
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

  const fetchItems = useCallback(async (isInitialFetch: boolean) => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '12' });
      // 커서 파라미터 이름을 API 사양에 맞게 변경 (lastId, lastCreatedAt)
      if (!isInitialFetch && nextCursor) {
        params.append('lastId', String(nextCursor.lastId));
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
  }, [fetchItems]); // fetchItems가 useCallback으로 감싸져 있으므로 의존성 배열이 안전합니다.

  const handleLoadMore = () => {
    fetchItems(false);
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      {/* --- 페이지 헤더 --- */}
      <header className="flex justify-between items-center mb-8">
        <h2 className="m-0 text-3xl font-bold text-left">합주단원 모집</h2>
        { user && <Link 
          to="/ensembles/create" // 등록 페이지 경로 변경
          className="inline-block py-2.5 px-5 text-base font-semibold text-white bg-blue-500 rounded-md no-underline text-center transition-colors hover:bg-blue-700"
        >
          모집 공고 등록하기
        </Link>}
      </header>

      {/* --- 에러 메시지 --- */}
      {error && (
        <div className="flex justify-center items-center py-16 px-4 text-center">
          <p className="text-lg text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* --- 모집 공고 목록 그리드 --- */}
      {items.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {items.map((item) => (
            <Link
              // --- 수정: id를 postId로 변경 ---
              key={`${item.postId}-${item.createdAt}`}
              to={`/ensembles/${item.postId}`}
              className="block bg-white border border-gray-200 rounded-lg p-5 no-underline text-slate-800 shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold mb-2 text-blue-700 truncate">{item.title}</h3>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  {/* --- 수정: ID를 텍스트로 변환하여 표시 --- */}
                  <p><strong>지역:</strong> {item.locationId || '정보 없음'}</p>
                  <p><strong>요구 실력:</strong> {item.skillLevel || '정보 없음'}</p>
                  <p><strong>연주 일자:</strong> {new Date(item.eventDate).toLocaleDateString()}</p>
                </div>
                <div className="mt-auto pt-3 text-xs text-right text-gray-400">
                  등록일: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- 공고 없음 메시지 --- */}
      {!loading && items.length === 0 && !error && (
        <div className="flex justify-center items-center py-16 px-4 text-center text-lg text-gray-600">
          <p>등록된 모집 공고가 없습니다.</p>
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
            className="py-3 px-8 text-lg font-semibold text-white bg-blue-500 rounded-md cursor-pointer transition-colors hover:bg-blue-700"
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
};

export default RecruitEnsembleListPage;