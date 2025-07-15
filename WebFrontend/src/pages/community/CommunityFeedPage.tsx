// WebFrontend/src/pages/community/CommunityFeedPage.tsx;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import axiosInstance from '../../services/axiosInstance';
import { useAuthStore } from '../../stores/authStore';
import Icon from '../../components/atoms/icon/Icon';
import PostLayout from '../../components/layout/PostLayout';
import FloatingWriteButton from '../../components/atoms/button/FloatingWriteButton';
import { togglePostLike } from '@/api';
import { CONTENT_TYPE } from '@/types/likes';

// --- 타입 정의 ---
export interface Post {
  postId: number;
  userId: string; 
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  likeCount: number;      
  commentCount: number;
  userLiked: boolean;      
  createdAt: string;
  updatedAt: string;
}

// --- API 함수들 ---
const fetchPosts = async (category: string): Promise<Post[]> => {
  // '전체' 카테리이거나 값이 없는 경우, 파라미터 객체를 비워서 요청
  const params = category && category !== '전체' ? { category } : {};
  
  const response = await axiosInstance.get('/posts', { params });

  console.log('feed page data')
  console.log(response.data);
  return response.data;
};

const deletePost = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/posts/${id}`);
};

// --- 유틸리티 함수 ---
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

// --- 메인 페이지 컴포넌트 ---
const CATEGORIES = ['전체', '자유게시판', '질문/답변', '피드백', '공연홍보'];

const CommunityFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPosts(selectedCategory);
        setPosts(data);
      } catch (err) {
        setError('게시물을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategory]);

  const handleDeletePost = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?\n관련된 모든 댓글도 함께 삭제됩니다.')) {
        try {
            await deletePost(postId);
            setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
            alert('게시글이 삭제되었습니다.');
        } catch (error) {
            alert('게시글 삭제에 실패했습니다.');
            console.error(error);
        }
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        await togglePostLike(CONTENT_TYPE.COMMUNITY, postId);
        setPosts(currentPosts => 
        currentPosts.map(p => {
            if (p.postId === postId) {
                const iLikedIt = !p.userLiked;
                
                // ⭐️ 이 부분을 수정합니다.
                const currentLikes = p.likeCount || 0; // p.likeCount가 없으면 0을 사용
                const newLikeCount = iLikedIt ? currentLikes + 1 : Math.max(0, currentLikes - 1); // 0 밑으로 내려가지 않도록 방지

                return { ...p, userLiked: iLikedIt, likeCount: newLikeCount };
            }
            return p;
        })
    );
    } catch (error) {
        alert('오류가 발생했습니다.');
    }

    
  };

  return (
    <PostLayout>
      <div className="p-4">
        {/* 카테고리 네비게이션 */}
        <nav className="mb-4 overflow-x-auto whitespace-nowrap smooth-scroll">
          <div className="flex space-x-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors
                  ${selectedCategory === category
                    ? 'bg-brand-primary text-brand-inverse'
                    : 'bg-brand-default text-brand-text-secondary hover:bg-gray-100'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>

        {/* 메인 콘텐츠 (게시글 목록) */}
        <main className="space-y-4">
          {isLoading ? (
            <p className="text-center text-brand-gray p-8">로딩 중...</p>
          ) : error ? (
            <p className="text-center text-brand-error-text p-8">{error}</p>
          ) : posts.length === 0 ? (
            <div className="text-center text-brand-gray p-8 bg-brand-default rounded-card">
              <p>아직 게시글이 없어요.</p>
              <p className="text-footnote mt-1">첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.postId}
                className="cursor-pointer bg-brand-default rounded-card p-4 hover:scale-101"
                onClick={() => navigate(`/community/${post.postId}`)}
              >
                {/* 게시글 상단 정보 */}
                <div className="flex items-center gap-3 mb-3">
                  <img src={post.authorProfileUrl || `https://i.pravatar.cc/50?u=${post.author}`} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-caption-bold text-brand-text-primary">{post.author}</p>
                    <p className="text-footnote text-brand-gray">
                      {timeSince(new Date(post.createdAt))} · <span className="font-semibold text-brand-primary">{post.category}</span>
                    </p>
                  </div>
                  {currentUser && currentUser.id === post.userId && (
                    <button onClick={(e) => handleDeletePost(e, post.postId)} className="text-footnote text-brand-disabled hover:text-brand-error-text">삭제</button>
                  )}
                </div>

                {/* 게시글 본문 */}
                <div className="space-y-2">
                  <h3 className="text-subheadline text-brand-text-primary">{post.title}</h3>
                  <p className="text-body text-brand-text-secondary line-clamp-3">{post.content}</p>
                  {post.thumbnailUrl && <img src={post.thumbnailUrl} alt={post.title} className="rounded-lg mt-3 w-full max-h-60 object-cover" />}
                </div>
                
                {/* 게시글 하단 정보 (좋아요, 댓글) */}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-brand-frame">
                  <button
                    className={`flex items-center gap-1.5 text-caption transition-colors ${post.userLiked ? 'text-red-500' : 'text-brand-gray hover:text-red-400'}`}
                    onClick={(e) => handleToggleLike(e, post.postId)}
                  >
                    <Icon name="like" size={18} fill={post.userLiked ? 'currentColor' : 'none'} className={post.userLiked ? '' : 'stroke-current'} />
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
        </main>
      </div>

      {/* 새 글 작성 플로팅 버튼 */}
      <FloatingWriteButton />
    </PostLayout>
  );
};

export default CommunityFeedPage;