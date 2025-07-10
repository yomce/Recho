import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- 타입 정의 ---
interface Post {
  id: number;
  author: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
}

// --- API 통신 함수 ---
const API_URL = import.meta.env.VITE_API_URL;
const fetchPostById = async (id: string): Promise<Post> => {
  const response = await axios.get(`${API_URL}/posts/${id}`);
  return response.data;
};

// --- 날짜 포맷 함수 ---
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// --- 상세 페이지 컴포넌트 ---
const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL에서 id 파라미터 가져오기
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadPost = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPostById(id);
        setPost(data);
      } catch (err) {
        setError('게시물을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [id]);

  if (isLoading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4">{error}</div>;
  if (!post) return <div className="p-4">게시물을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="mb-4 pb-4 border-b">
        <span className="text-sm text-blue-600 font-semibold">{post.category}</span>
        <h1 className="text-3xl font-bold my-2">{post.title}</h1>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>작성자: {post.author}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </header>

      <main className="py-8 prose max-w-none">
        {/* dangerouslySetInnerHTML은 XSS 공격에 취약할 수 있으니, 실제로는 DOMPurify 같은 라이브러리로 HTML을 정제(sanitize) 후 사용하세요. */}
        {/* 여기서는 간단하게 줄바꿈(\n)만 <br>로 치환합니다. */}
        <p dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
      </main>

      <footer className="pt-4 border-t">
        <button onClick={() => navigate('/community')} className="px-4 py-2 bg-gray-200 rounded-md">
            목록으로
        </button>
      </footer>
    </div>
  );
};

export default PostDetailPage;