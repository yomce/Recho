// src/pages/community/PostDetailPage.tsx

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import axiosInstance from "../../services/axiosInstance"; // 인증이 필요한 요청을 위한 Axios 인스턴스

// Layout 및 컴포넌트 import
import PostLayout from "@/components/layout/PostLayout";
import CommentItem from "@/components/molecules/comment/CommentItem";
import MessageInputForm from "@/components/atoms/input/MessageInput";
import Icon from "@/components/atoms/icon/Icon";

// --- 타입 정의 ---
// User 타입은 authStore 또는 user.entity.ts를 기반으로 정의합니다.
interface User {
  id: string;
  username: string;
}

// 게시물 타입
interface Post {
  id: number;
  userId: string;
  author: string;
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
  const response = await axiosInstance.post("/comments", data);
  return response.data;
};

const deleteComment = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/comments/${id}`);
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
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 데이터 로딩 로직
  useEffect(() => {
    if (!id) {
      setError("유효하지 않은 게시물 ID입니다.");
      setIsLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [postData, commentsData] = await Promise.all([
          fetchPostById(id),
          fetchCommentsByPostId(id),
        ]);
        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  // 댓글 등록 로직
  const handleCommentSubmit = async (commentText: string) => {
    if (!commentText.trim() || !currentUser || !id) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const createdComment = await createComment({
        postId: parseInt(id, 10),
        content: commentText,
      });
      setComments((prevComments) => [...prevComments, createdComment]);

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
      console.error(error);
    }
  };

  // 댓글 삭제 로직
  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      try {
        await deleteComment(commentId);
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId)
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
    <PostLayout bgClassName="text-left bg-brand-frame bg-brand-inverse">
      {/* --- 1. 스크롤이 필요한 모든 콘텐츠를 이 div 안에 배치합니다. --- */}
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
          dangerouslySetInnerHTML={{
            __html: post.content.replace(/\n/g, "<br />"),
          }}
        />

        {/* 댓글 섹션 */}
        <section className="mt-10 pt-6 border-t border-brand-frame border-top-1">
          <h2 className="text-body text-brand-text-primary mb-2 flex items-center gap-2">
            <span>댓글 ({comments.length})</span>
          </h2>
          {/* 댓글 목록 */}
          <div className="space-y-2 mb-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onDelete={handleDeleteComment}
                formatDate={formatDate}
              />
            ))}
            <div ref={commentsEndRef} />
          </div>
        </section>
      </div>{" "}
      {/* <--- 1. 스크롤 영역 div가 여기서 끝납니다. */}
      {/* --- 2. 하단에 고정될 댓글 입력 폼은 스크롤 영역 밖에 배치합니다. --- */}
      {currentUser && <MessageInputForm onSubmit={handleCommentSubmit} />}
    </PostLayout>
  );
};

export default PostDetailPage;
