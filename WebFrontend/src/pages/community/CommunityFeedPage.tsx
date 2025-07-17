// WebFrontend/src/pages/community/CommunityFeedPage.tsx;

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
// import axios from 'axios';

import axiosInstance from "../../services/axiosInstance";
import { useAuthStore } from "../../stores/authStore";
import Icon from '../../components/atoms/icon/Icon';
import PostLayout from "../../components/layout/PostLayout";
import FloatingWriteButton from "../../components/atoms/button/FloatingWriteButton";
import { togglePostLike } from "@/api";
import { CONTENT_TYPE } from "@/types/likes";
import CommunityFeed from "@/components/organisms/community/CommunityFeed";
import type { Post } from "@/types/post";


// --- 타입 정의 ---
// Post 인터페이스는 @/types/post.ts 로 이동했습니다.

// --- API 함수들 ---
const fetchPosts = async (
  category: string,
  keyword?: string | null,
  page: number = 1,
  limit: number = 10
): Promise<Post[]> => {
  const params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {
    page,
    limit,
  };

  if (keyword) {
    params.search = keyword;
  } else if (category && category !== "전체") {
    params.category = category;
  }

  const response = await axiosInstance.get("/posts", { params });
  return response.data;
};

const deletePost = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/posts/${id}`);
};

// --- 유틸리티 함수 ---
// timeSince 함수는 CommunityFeed.tsx 로 이동했습니다.

// --- 메인 페이지 컴포넌트 ---
const CATEGORIES = ["전체", "자유게시판", "질문/답변", "피드백", "공연홍보"];

const CommunityFeedPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("search");

  // 페이지네이션 계산
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPosts(
          selectedCategory,
          keyword,
          currentPage,
          POSTS_PER_PAGE
        );
        setPosts(data);
        if (currentPage === 1) window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        setError("게시물을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategory, keyword, currentPage]); // currentPage가 변경될 때도 데이터를 다시 불러오도록 추가

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (
      window.confirm(
        "정말로 이 글을 삭제하시겠습니까?\n관련된 모든 댓글도 함께 삭제됩니다."
      )
    ) {
      try {
        await deletePost(postId);
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.postId !== postId)
        );
        alert("게시글이 삭제되었습니다.");
      } catch (error) {
        alert("게시글 삭제에 실패했습니다.");
        console.error(error);
      }
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await togglePostLike(CONTENT_TYPE.COMMUNITY, postId);
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.postId === postId) {
            const iLikedIt = !p.userLiked;
            const currentLikes = p.likeCount || 0;
            const newLikeCount = iLikedIt
              ? currentLikes + 1
              : Math.max(0, currentLikes - 1);

            return { ...p, userLiked: iLikedIt, likeCount: newLikeCount };
          }
          return p;
        })
      );
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <PostLayout>
      <div className="p-4">
        {keyword ? (
          <h2 className="text-xl font-bold mb-4">
            '<span className="text-brand-primary">{keyword}</span>'에 대한 검색
            결과
          </h2>
        ) : (
          <nav className="mb-4 overflow-x-auto whitespace-nowrap smooth-scroll">
            <div className="flex space-x-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors
                                  ${
                                    selectedCategory === category
                                      ? "bg-brand-primary text-brand-inverse"
                                      : "bg-brand-default text-brand-text-secondary hover:bg-gray-100"
                                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* 메인 콘텐츠 (게시글 목록) */}
        <main className="space-y-4">
          {isLoading ? (
            <p>로딩 중...</p>
          ) : error ? (
            <p>{error}</p>
          ) : posts.length === 0 ? (
            <div className="text-center text-brand-gray p-8 bg-brand-default rounded-card">
              {/* 검색 결과가 없을 때 적절한 메시지 표시 */}
              <p>
                {keyword ? "검색 결과가 없습니다." : "아직 게시글이 없어요."}
              </p>
              {!keyword && (
                <p className="text-footnote mt-1">첫 번째 글을 작성해보세요!</p>
              )}
            </div>
          ) : (
            <CommunityFeed
              posts={currentPosts}
              currentUser={currentUser}
              handleDeletePost={handleDeletePost}
              handleToggleLike={handleToggleLike}
            />
          )}

          {/* 페이지네이션 */}
          {!isLoading && !error && posts.length > POSTS_PER_PAGE && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-primary text-brand-inverse hover:bg-brand-primary-dark"
                }`}
              >
                이전
              </button>

              {/* 페이지 번호들 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-brand-primary text-brand-inverse"
                        : "bg-brand-default text-brand-text-secondary hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-primary text-brand-inverse hover:bg-brand-primary-dark"
                }`}
              >
                다음
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 새 글 작성 플로팅 버튼 */}
      <FloatingWriteButton />
    </PostLayout>
  );
};

export default CommunityFeedPage;
