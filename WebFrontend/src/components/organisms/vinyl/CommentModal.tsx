import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from "react-router-dom";
import type { Comment } from '@/types/comment';
import Avatar from '@/components/atoms/avatar/Avatar';
import { DEFAULT_IMAGES } from '@/constants/images';
import MessageInput from '@/components/molecules/message/MessageInput';
import Icon from '@/components/atoms/icon/Icon';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
}

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}년 전`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}달 전`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}일 전`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}시간 전`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}분 전`;
  return "방금 전";
};

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, comments, onAddComment }) => {
  const navigate = useNavigate(); // 프로필 클릭 시 이동을 위한 navigate 함수
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsActive(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const modalRoot = document.getElementById('modal-root');

  useEffect(() => {
    if (isOpen) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen || !modalRoot) return null;

  const handleProfileClick = (userId: string) => {
    if (userId) {
      navigate(`/users/${userId}`);
    }
  };

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ease-in-out ${isActive ? 'bg-opacity-40' : 'bg-opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`relative z-50 flex h-4/6 w-11/12 max-w-[430px] flex-col rounded-card bg-brand-default shadow-lg transition-all duration-300 ease-in-out ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="relative flex-shrink-0 border-b border-brand-frame p-4 text-center">
          <h3 className="text-subheadline font-bold text-brand-text-primary">
            댓글 <span className="ml-1 text-brand-gray">{comments.length}</span>
          </h3>
          <button
            onClick={handleClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-brand-frame"
            aria-label="닫기"
          >
            <Icon name="close" size={24} className="text-brand-gray" />
          </button>
        </div>

        {/* 👇 댓글 목록: 요청하신 최종 레이아웃으로 수정한 부분입니다. */}
        <div className="flex-1 overflow-y-auto p-4">
          {comments.map((comment) => (
            <div key={comment.commentId} className="mb-5 flex items-start gap-3">
              {/* 왼쪽: 아바타 */}
              <div 
                className="cursor-pointer"
                onClick={() => handleProfileClick(comment.user.id)}
              >
                <Avatar
                  src={comment.user.profileUrl || DEFAULT_IMAGES.PROFILE}
                  size={40}
                  alt={comment.user.username}
                />
              </div>

              {/* 오른쪽: 닉네임/시간 및 댓글 내용 */}
              <div className="flex-1 text-left">
                {/* 윗 줄: 닉네임과 시간 */}
                <div className="flex items-baseline gap-2">
                  <p 
                    className="text-caption-bold text-brand-text-primary cursor-pointer"
                    onClick={() => handleProfileClick(comment.user.id)}
                  >
                    {comment.user.username}
                  </p>
                  <p className="text-footnote text-brand-gray">
                    {timeSince(new Date(comment.createdAt))}
                  </p>
                </div>

                {/* 아랫 줄: 댓글 내용 */}
                <p className="mt-1 text-body text-brand-text-secondary break-all whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* 푸터 (메시지 입력창) */}
        <footer className="flex-shrink-0 border-t border-brand-frame bg-brand-default p-4">
          <div className="flex items-end gap-3">
            <MessageInput
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSubmit}
              className="flex-shrink-0 rounded-full bg-brand-primary p-3 text-white disabled:bg-brand-disabled"
              disabled={isSubmitting || !newComment.trim()}
              aria-label="댓글 보내기"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>,
    modalRoot
  );
};

export default CommentsModal;