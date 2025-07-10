import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore'; // authStore 임포트

// --- 타입 정의 ---
interface Post {
  id: number;
  author: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
}
interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

// --- API 통신 함수 ---
const API_URL = import.meta.env.VITE_API_URL;
const apiClient = axios.create({ baseURL: API_URL });

const fetchPostById = async (id: string): Promise<Post> => {
  const response = await apiClient.get(`/posts/${id}`);
  return response.data;
};
const fetchCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  const response = await apiClient.get(`/comments/post/${postId}`);
  return response.data;
};
const createComment = async (data: { postId: number; author: string; content: string }): Promise<Comment> => {
    const response = await apiClient.post('/comments', data);
    return response.data;
}

// --- 날짜 포맷 함수 ---
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ko-KR');

// --- 상세 페이지 컴포넌트 ---
const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        // 게시물과 댓글을 동시에 불러옵니다.
        const [postData, commentsData] = await Promise.all([
            fetchPostById(id),
            fetchCommentsByPostId(id)
        ]);
        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !id) return;

    try {
        const createdComment = await createComment({
            postId: parseInt(id, 10),
            author: currentUser.username,
            content: newComment,
        });
        setComments([...comments, createdComment]); // 새 댓글을 목록에 추가
        setNewComment(''); // 입력창 비우기
    } catch (error) {
        alert('댓글 등록에 실패했습니다.');
    }
  }

  if (isLoading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4">{error}</div>;
  if (!post) return <div className="p-4">게시물을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ... (게시물 상세 내용 렌더링 부분) ... */}
      <header className="mb-4 pb-4 border-b">
        <span className="text-sm text-blue-600 font-semibold">{post.category}</span>
        <h1 className="text-3xl font-bold my-2">{post.title}</h1>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>작성자: {post.author}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </header>
      <main className="py-8 prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
      
      {/* --- 댓글 섹션 --- */}
      <section className="mt-10 pt-6 border-t">
        <h2 className="text-xl font-bold mb-4">댓글 ({comments.length})</h2>
        
        {/* 댓글 목록 */}
        <div className="space-y-4 mb-6">
            {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-800 text-sm">{comment.content}</p>
                </div>
            ))}
        </div>

        {/* 댓글 작성 폼 */}
        {currentUser && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="flex-grow p-2 border rounded-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">등록</button>
            </form>
        )}
      </section>

      <footer className="mt-10 pt-4 border-t">
        <button onClick={() => navigate('/community')} className="px-4 py-2 bg-gray-200 rounded-md">
            목록으로
        </button>
      </footer>
    </div>
  );
};

export default PostDetailPage;