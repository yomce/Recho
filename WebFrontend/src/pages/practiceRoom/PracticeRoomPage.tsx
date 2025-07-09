import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  type PracticeRoom,
  type PaginatedPracticeRoomResponse,
} from "@/types/practiceRoom";

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

        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get<PaginatedPracticeRoomResponse>(
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
    <div className="app-container">
      <div className="centered-card-container">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="flex-row items-center justify-between mb-8">
            <h2 className="text-title">합주실 목록</h2>
            <Link to="/practice-room/create" className="button-brand-primary">
              합주실 등록하기
            </Link>
          </div>
          {error && (
            <div className="button-brand-gray mb-4">
              <p className="text-brand-error-text">{error}</p>
            </div>
          )}

          {post.length > 0 ? (
            <div className="item-list">
              {post.map((post) => (
                <div key={`${post.postId}-${post.createdAt}`} className="flex">
                  <a
                    href={`/practice-room/${post.postId}`}
                    className="item-card w-full"
                  >
                    <div className="item-image-container">
                      <img
                        src={post.imageUrl || "https://placehold.co/600x400"}
                        alt={post.title}
                      />
                    </div>
                    <div className="item-info flex flex-col gap-2">
                      <h3 className="text-subheadline mb-1 truncate">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="date text-footnote text-brand-text-disabled ml-auto">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="location text-caption text-brand-gray mb-2">
                        {post.location?.address}
                        {post.location?.regionLevel1}{" "}
                        {post.location?.regionLevel2}
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="message-container">
                <p>등록된 연습실이 없습니다.</p>
              </div>
            )
          )}

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
      </div>
    </div>
  );
};

export default PracticeRoomPage;
