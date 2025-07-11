import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../services/axiosInstance';
import { type Post } from '../../types/post'; // Post 타입은 재사용할 수 있으므로 그대로 둡니다.

// ⭐️ 1. CreatePostData 타입을 이 파일 안으로 가져옵니다.
interface CreatePostData {
  title: string;
  content: string;
  category: string;
}

// ⭐️ 2. createPost 함수를 파일 내에 직접 정의하고 axiosInstance를 사용합니다.
const createPost = async (newPostData: CreatePostData): Promise<Post> => {
    const response = await axiosInstance.post('/posts', newPostData);
    return response.data;
};

const NewPostPage: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('자유게시판');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            toast.error('글을 작성하려면 로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        if (!title.trim() || !content.trim()) {
            toast.error('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newPostData: CreatePostData = {
                title,
                category,
                content,
            };
            
            // ⭐️ 3. 파일 내에 새로 정의된 createPost 함수를 호출합니다.
            await createPost(newPostData);

            toast.success('게시글이 성공적으로 등록되었습니다!');
            navigate('/community');
        } catch (error) {
            toast.error('게시글 등록에 실패했습니다. 다시 시도해주세요.');
            console.error('Post creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">새 글 작성</h1>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option>자유게시판</option>
                        <option>질문/답변</option>
                        <option>피드백</option>
                        <option>공연홍보</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        placeholder="내용을 입력하세요"
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded-md">
                        취소
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400">
                        {isSubmitting ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewPostPage;