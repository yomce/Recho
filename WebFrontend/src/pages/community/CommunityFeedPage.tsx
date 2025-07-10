import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CommunityFeedPage.css'; // 스타일 파일은 그대로 사용합니다.

// ⭐️ 1. 타입 정의
export interface Post {
  id: number;
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ⭐️ 2. API 통신 함수 (카테고리 파라미터 추가)
const API_URL = import.meta.env.VITE_API_URL;
const apiClient = axios.create({ baseURL: API_URL });

const fetchPosts = async (category: string): Promise<Post[]> => {
  const response = await apiClient.get('/posts', {
    params: { category },
  });
  return response.data;
};

// 날짜 유틸리티 함수
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


// ⭐️ 3. 메인 페이지 컴포넌트
const CATEGORIES = ['전체', '자유게시판', '질문/답변', '밴드모집', '공연홍보'];

const CommunityFeedPage: React.FC = () => {
  const navigate = useNavigate();
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
          <p>로딩 중...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          posts.map((post) => (
            // ⭐️ PostCard 컴포넌트 대신 JSX를 직접 렌더링
            <article 
            key={post.id} 
            className="post-card cursor-pointer" // cursor-pointer로 클릭 가능함을 표시
            onClick={() => navigate(`/community/${post.id}`)}
            >
              <div className="post-header">
                <img
                  src={post.authorProfileUrl || 'https://i.pravatar.cc/50'}
                  alt={post.author}
                  className="author-avatar"
                />
                <div className="author-info">
                  <strong>{post.author}</strong>
                  <span>{timeSince(new Date(post.createdAt))} · <span className="category">{post.category}</span></span>
                </div>
              </div>
              <div className="post-content">
                <h3>{post.title}</h3>
                <p>{post.content.substring(0, 150)}...</p>
                {post.thumbnailUrl && (
                  <img src={post.thumbnailUrl} alt={post.title} className="post-thumbnail" />
                )}
              </div>
              <div className="post-footer">
                <span>❤️ 좋아요 {post.likes}</span>
                <span>💬 댓글 {post.commentCount}</span>
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