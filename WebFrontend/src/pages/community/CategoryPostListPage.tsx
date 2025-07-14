// src/pages/community/CategoryPostListPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { useAuthStore } from '../../stores/authStore';
import PostLayout from '../../components/layout/PostLayout';
import FloatingWriteButton from '../../components/atoms/button/FloatingWriteButton';
import Icon from '../../components/atoms/icon/Icon';
import { type Post } from './CommunityFeedPage'; // 타입 재사용

// --- 유틸리티 및 API 함수 ---
const fetchPostsByCategory = async (category: string): Promise<Post[]> => {
  const response = await axiosInstance.get('/posts', { params: { category } });
  return response.data;
};

const togglePostLike = async (postId: number): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + '년 전';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + '달 전';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + '일 전';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + '시간 전';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + '분 전';
    return '방금 전';
};

// --- URL 경로와 실제 카테고리 이름을 매핑 ---
const CATEGORY_MAP: { [key: string]: string } = {
  free: '자유게시판',
  qna: '질문/답변',
  feedback: '피드백',
  promo: '공연홍보',
};

const CategoryPostListPage: React.FC = () => {
  const { categoryKey = 'free' } = useParams<{ categoryKey: string }>();
  const categoryName = CATEGORY_MAP[categoryKey] || '알 수 없는 카테고리';
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPostsByCategory(categoryName);
        setPosts(data);
      } catch (err) {
        setError('게시물을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    if (categoryName !== '알 수 없는 카테고리') {
        loadPosts();
    }
  }, [categoryName]);

  const handleToggleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    // (이하 로직은 CommunityFeedPage와 동일)
    setPosts(currentPosts => 
        currentPosts.map(p => 
            p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p
        )
    );
    try {
        await togglePostLike(postId);
    } catch (error) {
        alert('오류가 발생했습니다.');
    }
  };

  return (
    <PostLayout>
      <div className="p-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-brand-gray p-8">게시글을 불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-brand-error-text p-8">{error}</p>
        ) : posts.length === 0 ? (
          <div className="text-center text-brand-gray p-8 bg-brand-default rounded-card">
            <p className="text-body">아직 게시글이 없어요.</p>
            <p className="text-footnote mt-1">첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            // 게시글 렌더링 UI (CommunityFeedPage와 동일한 구조 사용)
             <article
                key={post.id}
                className="cursor-pointer bg-brand-default rounded-card p-4 hover:shadow-lg transition-shadow duration-300"
                onClick={() => navigate(`/community/posts/${post.id}`)}
              >
                {/* (이하 게시글 UI는 아래 CommunityFeedPage.tsx의 것과 동일하게 적용) */}
                <div className="flex items-center gap-3 mb-3">
                  <img src={post.authorProfileUrl || `https://i.pravatar.cc/50?u=${post.author}`} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-caption-bold text-brand-text-primary">{post.author}</p>
                    <p className="text-footnote text-brand-gray">
                      {timeSince(new Date(post.createdAt))}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-subheadline text-brand-text-primary">{post.title}</h3>
                  <p className="text-body text-brand-text-secondary line-clamp-3">{post.content}</p>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-brand-frame">
                  <button
                    className={`flex items-center gap-1.5 text-caption transition-colors ${post.isLiked ? 'text-red-500' : 'text-brand-gray hover:text-red-400'}`}
                    onClick={(e) => handleToggleLike(e, post.id)}
                  >
                    <Icon name="like" size={18} fill={post.isLiked ? 'currentColor' : 'none'} className={post.isLiked ? '' : 'stroke-current'} />
                    <span>{post.likeCount}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-caption text-brand-gray">
                    <Icon name="chat" size={18} />
                    <span>{post.commentCount}</span>
                  </div>
                </div>
              </article>
          ))
        )}
      </div>
      {/* 글 작성 버튼: 현재 카테고리 정보를 쿼리 파라미터로 넘김 */}
      {/* <FloatingWriteButton onClick={() => navigate(`/community/new?category=${categoryKey}`)} /> */}
      {/* 해당 내용은 쿼리 파라미터로 넘길 필요가 없습니다. 드롭다운에서 POST 요청 시 카테고리를 구분하도록 변경해주세요 */}
      <FloatingWriteButton />
    </PostLayout>
  );
};

export default CategoryPostListPage;