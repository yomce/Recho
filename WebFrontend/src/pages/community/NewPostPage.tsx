import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { createPost } from '../../services/postService';
import { type CreatePostData } from '../../types/post';
import { useAuthStore } from '../../stores/authStore'; // ⭐️ authStore 임포트

const NewPostPage: React.FC = () => {
    const navigate = useNavigate();
    
    // ⭐️ authStore에서 현재 로그인된 사용자 정보를 가져옵니다.
    const currentUser = useAuthStore((state) => state.user);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('자유게시판');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ⭐️ authStore의 user 상태로 로그인 여부를 확인합니다.
        if (!currentUser) {
            toast.error('글을 작성하려면 로그인이 필요합니다.');
            navigate('/login'); // 로그인 페이지로 리디렉션
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
                // ⭐️ 스토어에서 가져온 사용자 이름으로 작성자를 설정합니다.
                author: currentUser.username, 
            };
            
            await createPost(newPostData);

            toast.success('게시글이 성공적으로 등록되었습니다!');
            navigate('/community'); // 등록 후 커뮤니티 피드로 이동
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
                        <option>밴드모집</option>
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