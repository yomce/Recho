// src/components/molecules/comment/CommentItem.tsx

import React from "react";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";
import type { Comment } from "@/types/comment"; // 👈 전역 Comment 타입 임포트
import type { User } from '@/stores/authStore';

// --- 타입 정의 ---
// 💡 전역 타입을 사용하므로 로컬 타입 정의는 삭제합니다.

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onDelete: (id: number | string) => void; // 👈 id 타입을 number | string으로 변경
  formatDate: (dateString: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onDelete,
  formatDate,
}) => {
  console.log('comment');
  console.log(comment);

  return (
    <div className="flex items-start py-2 gap-2 bg-brand-default border-brand-frame border-top-1">
      <Avatar
        src={`https://i.pravatar.cc/40?u=${comment.userId}`}
        alt={comment.userId}
        size={40}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          {/* 👈 comment.author -> comment.user로 변경 */}
          <span className="text-caption-bold text-brand-text-primary">
            {comment.userId}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-footnote text-brand-gray">
              {formatDate(comment.createdAt)}
            </span>
            {/* 👈 권한 확인을 comment.userId로 변경 */}
            {currentUser && currentUser.id === comment.userId && (
              <button onClick={() => onDelete(comment.userId)}>
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