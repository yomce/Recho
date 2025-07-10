import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import './CommunityFeedPage.css';
import axiosInstance from '../../services/axiosInstance';
import { useAuthStore } from '../../stores/authStore';
import Icon from '../../components/atoms/icon/Icon';

// --- 타입 정의 ---
export interface Post {
  id: number;
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  likeCount: number;      
  commentCount: number;
  isLiked: boolean;      
  createdAt: string;
  updatedAt: string;
}

// --- API 함수들 ---
const fetchPosts = async (category: string): Promise<Post[]> => {
  const response = await axiosInstance.get('/posts', { params: { category } });
  return response.data;
};

const deletePost = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/posts/${id}`);
};

const togglePostLike = async (postId: number): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
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
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
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

    setPosts(currentPosts => 
        currentPosts.map(p => {
            if (p.id === postId) {
                const iLikedIt = !p.isLiked;
                
                // ⭐️ 이 부분을 수정합니다.
                const currentLikes = p.likeCount || 0; // p.likeCount가 없으면 0을 사용
                const newLikeCount = iLikedIt ? currentLikes + 1 : Math.max(0, currentLikes - 1); // 0 밑으로 내려가지 않도록 방지

                return { ...p, isLiked: iLikedIt, likeCount: newLikeCount };
            }
            return p;
        })
    );
    
    try {
        await togglePostLike(postId);
    } catch (error) {
        alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="feed-container">
      <header className="feed-header">
        <h1 className="text-2xl font-bold">🎸 커뮤니티</h1>
        <nav className="category-nav mt-4">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </nav>
      </header>
      
      <main className="post-list">
        {isLoading ? (
          <p className="text-center p-4">로딩 중...</p>
        ) : error ? (
          <p className="text-center p-4 text-red-500">{error}</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="post-card" onClick={() => navigate(`/community/${post.id}`)}>
              <div className="post-header">
                <img src={post.authorProfileUrl || 'https://i.pravatar.cc/50'} alt={post.author} className="author-avatar" />
                <div className="author-info">
                    <strong>{post.author}</strong>
                    <span>{timeSince(new Date(post.createdAt))} · <span className="category">{post.category}</span></span>
                </div>
                {currentUser && currentUser.username === post.author && (
                    <button onClick={(e) => handleDeletePost(e, post.id)} className="ml-auto text-sm text-red-500 hover:underline p-1 shrink-0">삭제</button>
                )}
              </div>
              <div className="post-content">
                  <h3>{post.title}</h3>
                  <p>{post.content.substring(0, 150)}...</p>
                  {post.thumbnailUrl && <img src={post.thumbnailUrl} alt={post.title} className="post-thumbnail" />}
              </div>
              <div className="post-footer">
                <button
                  className={`flex items-center gap-1 cursor-pointer ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                  onClick={(e) => handleToggleLike(e, post.id)}
                >
                  <Icon name="like" size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likeCount}</span>
                </button>
                <div className="flex items-center gap-1 text-gray-500">
                  <Icon name="chat" size={18} />
                  <span>{post.commentCount}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      <button
        className="new-post-button"
        aria-label="새 글 작성"
        onClick={() => navigate('/community/new')}
      >
        +
      </button>
    </div>
  );
};

export default CommunityFeedPage;