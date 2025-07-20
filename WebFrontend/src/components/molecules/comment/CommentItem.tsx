// src/components/molecules/comment/CommentItem.tsx

import React from "react";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";

import { DEFAULT_IMAGES } from "@/constants/images";
import type { Comment } from "@/types/comment"; // 👈 전역 Comment 타입 임포트
import type { User } from '@/stores/authStore';


interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onDelete: (id: number | string) => void;
  formatDate: (dateString: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onDelete,
  formatDate,
}) => {
  const authorName = comment.user ? comment.user.username : '알 수 없는 사용자';
  const authorProfileUrl = comment.user ? comment.user.profileImageUrl : DEFAULT_IMAGES.PROFILE;

  console.log(comment);

  return (
    <div className="flex items-start py-2 gap-2 bg-brand-default border-brand-frame border-top-1">
      {/* 프로필 이미지 */}
      <Avatar
        src={authorProfileUrl || DEFAULT_IMAGES.PROFILE}
        alt={authorName}
        size={40}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          {/* 작성자 이름 표시 */}
          <span className="text-caption-bold text-brand-text-primary">
            {authorName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-footnote text-brand-gray">
              {formatDate(comment.createdAt)}
            </span>
            {/* 삭제 버튼 권한 확인 */}
            {currentUser && currentUser.id === comment.userId && (
              // 삭제 시 comment.commentId를 전달하도록 수정
              <button onClick={() => onDelete(comment.commentId)}>
                <Icon
                  name="delete"
                  size={16}
                  className="text-brand-disabled hover:text-brand-error-text"
                />
              </button>
            )}
          </div>
        </div>
        <p className="text-body text-brand-text-secondary whitespace-pre-wrap text-left">
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export default CommentItem;