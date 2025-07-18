// src/components/molecules/comment/CommentItem.tsx

import React from "react";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";
import { DEFAULT_IMAGES } from "@/constants/images";

// --- 타입 정의 ---
interface User {
  id: string;
  username: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: User;
}

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onDelete: (id: number) => void;
  formatDate: (dateString: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onDelete,
  formatDate,
}) => {
  return (
    <div className="flex items-start py-2 gap-2 bg-brand-default  border-brand-frame border-top-1">
      {/* 프로필 이미지 */}
      <Avatar
        src={DEFAULT_IMAGES.PROFILE}
        alt={comment.author.username}
        size={40}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          {/* 작성자 정보 */}
          <span className="text-caption-bold text-brand-text-primary">
            {comment.author.username}
          </span>
          {/* 댓글 작성 시간 및 삭제 버튼 */}
          <div className="flex items-center gap-2">
            <span className="text-footnote text-brand-gray">
              {formatDate(comment.createdAt)}
            </span>
            {currentUser && currentUser.id === comment.author.id && (
              <button onClick={() => onDelete(comment.id)}>
                <Icon
                  name="delete"
                  size={16}
                  className="text-brand-disabled hover:text-brand-error-text"
                />
              </button>
            )}
          </div>
        </div>
        {/* 댓글 내용 */}
        <p className="text-body text-brand-text-secondary whitespace-pre-wrap text-left">
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export default CommentItem;
