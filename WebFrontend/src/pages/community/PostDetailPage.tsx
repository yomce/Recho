// src/pages/community/PostDetailPage.tsx

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from '../../stores/chatStore';
import axiosInstance from "../../services/axiosInstance";

// Layout 및 컴포넌트 import
import PostLayout from "@/components/layout/PostLayout";
import CommentItem from "@/components/molecules/comment/CommentItem";
import MessageInputForm from "@/components/atoms/input/MessageInput";
import type { Post } from '@/types/post';
import type { Comment } from '@/types/comment';
import { CONTENT_TYPE } from '@/types/likes';

import VideoPreviewSection from '@/components/atoms/card/VideoPreviewCard';

// --- 타입 정의 ---

// 댓글 생성 시 API로 보낼 데이터 타입 (contentType 추가)
interface CreateCommentData {
  contentType: 'community'; // 또는 다른 콘텐츠 타입
  postId: number;
  content: string;
}

// --- API 통신 함수 ---

/**
 * ID로 단일 게시물을 조회합니다. (댓글이 포함되어 반환됩니다)
 */
const fetchPostById = async (id: string): Promise<Post> => {
  const response = await axiosInstance.get(`/posts/${id}`);
  return response.data;
};

/**
 * 새로운 댓글을 생성합니다.
 */
const createComment = async (data: CreateCommentData): Promise<Comment> => {
  const response = await axiosInstance.post("/comments", data);
  return response.data;
};

/**
 * 댓글을 삭제합니다. (ID 타입에 따라 동적으로 경로를 설정합니다)
 */
const deleteComment = async (id: number | string): Promise<void> => {
  const path = typeof id === 'number' ? 'number' : 'string';
  await axiosInstance.delete(`/comments/${path}/${id}`);
};

// --- 날짜 포맷 함수 ---
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// --- 상세 페이지 컴포넌트 ---
const PostDetailPage: React.FC = () => {
  const { totalUnreadCount } = useChatStore();
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // [수정됨] 데이터 로딩 로직
  useEffect(() => {
    if (!id) {
      setError("유효하지 않은 게시물 ID입니다.");
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        setIsLoading(true);
        // fetchPostById 호출 한 번으로 게시물과 댓글 데이터를 모두 가져옵니다.
        const postData = await fetchPostById(id);
        setPost(postData);
        setComments(postData.comments || []); // postData에 포함된 댓글을 상태로 설정
      } catch (err) {
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  // [수정됨] 댓글 등록 로직
  const handleCommentSubmit = async (commentText: string) => {
    if (!commentText.trim() || !currentUser || !id) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const createdComment = await createComment({
        contentType: CONTENT_TYPE.COMMUNITY,
        postId: parseInt(id, 10),
        content: commentText,
      });
      // API가 반환한 완전한 객체를 상태에 추가
      setComments((prevComments) => [...prevComments, createdComment]);

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
      console.error(error);
    }
  };

  // [수정됨] 댓글 삭제 로직 (id 타입을 number | string으로 확장)
  const handleDeleteComment = async (commentId: number | string) => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      try {
        await deleteComment(commentId);
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.commentId !== commentId)
        );
        alert("댓글이 삭제되었습니다.");
      } catch (error) {
        alert("댓글 삭제에 실패했습니다. 권한이 없거나 오류가 발생했습니다.");
        console.error(error);
      }
    }
  };

  if (isLoading) return <div className="p-4 text-center">로딩 중...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!post)
    return <div className="p-4 text-center">게시물을 찾을 수 없습니다.</div>;

  return (
    <PostLayout 
      totalUnreadCount={totalUnreadCount} 
      bgClassName="text-left bg-brand-frame bg-brand-inverse">
        
      <div className="p-4">
        {/* 게시글 헤더 */}
        <header className="mb-4 pb-4 border-b border-brand-frame">
          <span className="text-caption-bold text-brand-primary">
            {post.category}
          </span>
          <h1 className="text-headline my-2 text-brand-text-primary">
            {post.title}
          </h1>
          <div className="flex justify-between items-center text-brand-gray">
            <span className="text-caption-bold">{post.author}</span>
            <span className="text-caption">{formatDate(post.createdAt)}</span>
          </div>
        </header>

        {/* 게시글 본문 */}
        <main
          className="py-8 text-body text-brand-text-secondary"
        >
          <pre className="whitespace-pre-wrap break-words text-left">
            {post.content}
          </pre>
        </main>

        {/* [추가] 비디오 프리뷰 */}
        {post && (
          <VideoPreviewSection
            refIn="posts"
            refPostId={post.postId}
          />
        )}

        {/* 댓글 섹션 */}
        <section className="mt-10 pt-6 border-t border-brand-frame border-top-1">
          <h2 className="text-body text-brand-text-primary mb-2 flex items-center gap-2">
            <span>댓글 ({comments.length})</span>
          </h2>
          <div className="space-y-2 mb-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                currentUser={currentUser}
                onDelete={handleDeleteComment}
                formatDate={formatDate}
              />
            ))}
            <div ref={commentsEndRef} />
          </div>
        </section>
      </div>
      {currentUser && <MessageInputForm onSubmit={handleCommentSubmit} />}
    </PostLayout>
  );
};

export default PostDetailPage;