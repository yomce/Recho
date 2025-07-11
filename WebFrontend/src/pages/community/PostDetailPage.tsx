import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../services/axiosInstance'; // 인증이 필요한 요청을 위한 Axios 인스턴스

// --- 타입 정의 ---
// User 타입은 authStore 또는 user.entity.ts를 기반으로 정의합니다.
interface User {
    id: string;
    username: string;
}

// 게시물 타입
interface Post {
  id: number;
  author: string; // 게시물 작성자는 문자열 이름으로 가정
  category: string;
  title: string;
  content: string;
  createdAt: string;
}

// 댓글 타입 (백엔드와 일치하도록 author를 User 객체로 변경)
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: User; 
}

// 댓글 생성 시 API로 보낼 데이터 타입
interface CreateCommentData {
    postId: number;
    content: string;
}


// --- API 통신 함수 ---
// 인증이 필요한 요청은 모두 axiosInstance를 사용합니다.
const fetchPostById = async (id: string): Promise<Post> => {
  const response = await axiosInstance.get(`/posts/${id}`);
  return response.data;
};

const fetchCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  const response = await axiosInstance.get(`/comments/post/${postId}`);
  return response.data;
};

const createComment = async (data: CreateCommentData): Promise<Comment> => {
    const response = await axiosInstance.post('/comments', data);
    return response.data;
};

const deleteComment = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/comments/${id}`);
};


// --- 날짜 포맷 함수 ---
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
});


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
    if (!id) {
        setError('유효하지 않은 게시물 ID입니다.');
        setIsLoading(false);
        return;
    }
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [postData, commentsData] = await Promise.all([
            fetchPostById(id),
            fetchCommentsByPostId(id)
        ]);
        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !id) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    try {
        const createdComment = await createComment({
            postId: parseInt(id, 10),
            content: newComment,
        });
        setComments(prevComments => [...prevComments, createdComment]);
        setNewComment('');
    } catch (error) {
        alert('댓글 등록에 실패했습니다.');
        console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        try {
            await deleteComment(commentId);
            setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
            alert('댓글이 삭제되었습니다.');
        } catch (error) {
            alert('댓글 삭제에 실패했습니다. 권한이 없거나 오류가 발생했습니다.');
            console.error(error);
        }
    }
  };

  if (isLoading) return <div className="p-4 text-center">로딩 중...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-4 text-center">게시물을 찾을 수 없습니다.</div>;

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
      
      <main className="py-8 prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
      
      <section className="mt-10 pt-6 border-t">
        <h2 className="text-xl font-bold mb-4">댓글 ({comments.length})</h2>
        <div className="space-y-4 mb-6">
            {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{comment.author.username}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                            {currentUser && currentUser.id === comment.author.id && (
                                <button 
                                    onClick={() => handleDeleteComment(comment.id)} 
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
            ))}
        </div>

        {currentUser && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="flex-grow p-2 border rounded-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md shrink-0">등록</button>
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