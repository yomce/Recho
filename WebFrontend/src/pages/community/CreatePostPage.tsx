/// WebFrontend/src/pages/community/CreatePostPage.tsx
import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../services/axiosInstance';

// Layout & Button Components
import PostLayout from '@/components/layout/PostLayout';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';

// Form Components
import InputLabel from '@/components/atoms/input/InputLabel';
import TextInputForm from '@/components/atoms/input/TextInputForm';
import TextAreaInput from '@/components/atoms/input/TextAreaInput';
import SelectInput from '@/components/atoms/input/SelectInput'; // 새로 만든 컴포넌트

interface CreatePostData {
  title: string;
  content: string;
  category: string;
}

const createPost = async (newPostData: CreatePostData) => {
    const response = await axiosInstance.post('/posts', newPostData);
    return response.data;
};

// 카테고리 옵션들을 상수로 분리하여 관리
const CATEGORY_OPTIONS = ['자유게시판', '질문/답변', '피드백', '공연홍보'];

const CreatePostPage: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]); // 기본값 설정
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
            await createPost({ title, category, content });
            toast.success('게시글이 성공적으로 등록되었습니다!');
            navigate('/community', { replace: true });
        } catch (error) {
            toast.error('게시글 등록에 실패했습니다. 다시 시도해주세요.');
            console.error('Post creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PostLayout>
            <div className="p-4 bg-brand-frame min-h-screen">
                <header className="mb-6">
                    <h1 className="text-subheadline text-brand-text-primary">새 글 작성</h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="category">카테고리</InputLabel>
                        <SelectInput
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            options={CATEGORY_OPTIONS}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="title">제목</InputLabel>
                        <TextInputForm
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="content">내용</InputLabel>
                        <TextAreaInput
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            placeholder="내용을 입력하세요."
                        />
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-4">
                        <SecondaryButton type="button" onClick={() => navigate(-1)}>
                            취소
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '등록 중...' : '등록하기'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </PostLayout>
    );
};

export default CreatePostPage;