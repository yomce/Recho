import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import './CommunityFeedPage.css'; // 기본적인 스타일을 위해 CSS 파일은 임포트합니다.
import { useNavigate } from 'react-router-dom'; // useNavigate 임포트 확인

// 1. 타입 정의 (원래 types/post.ts)
interface Post {
  id: number;
  author: string;
  authorProfileUrl?: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

// 2. API 통신 함수 (원래 services/postService.ts)
const API_URL = import.meta.env.VITE_API_URL;
const fetchPosts = async (): Promise<Post[]> => {
  const response = await axios.get(`${API_URL}/posts`);
  return response.data;
};

// 3. 날짜 유틸리티 함수 (원래 utils/date.ts)
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

// 4. 메인 페이지 컴포넌트
const CommunityFeedPage: React.FC = () => {
  const navigate = useNavigate(); // ⭐️ navigate 함수 초기화

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPosts();
        setPosts(data);
      } catch (err) {
        setError('게시물을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  if (isLoading) {
    return <div className="feed-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="feed-container">{error}</div>;
  }

  return (
    <div className="feed-container">
      <header className="feed-header">
        <h1>🎸 커뮤니티</h1>
      </header>

      {/* 게시물 목록 렌더링 */}
      <main className="post-list">
        {posts.map((post) => (
          // PostCard 컴포넌트 대신 직접 JSX 렌더링
          <article key={post.id} className="post-card">
            <div className="post-header">
              <img
                src={post.authorProfileUrl || 'https://i.pravatar.cc/50'}
                alt={post.author}
                className="author-avatar"
              />
              <div className="author-info">
                <strong>{post.author}</strong>
                <span>
                  {timeSince(new Date(post.createdAt))} · <span className="category">{post.category}</span>
                </span>
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
              <span>💬 댓글 {post.comments}</span>
            </div>
          </article>
        ))}
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