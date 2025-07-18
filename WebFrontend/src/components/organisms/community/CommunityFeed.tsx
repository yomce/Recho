import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/atoms/icon/Icon";
import IconButton from "@/components/atoms/button/IconButton";
import type { Post } from "@/types/post";
import DEFAULT_IMAGES from "@/constants/images";

interface CommunityFeedProps {
  posts: Post[];
  currentUser: { id: string } | null;
  handleDeletePost: (e: React.MouseEvent, postId: number) => void;
  handleToggleLike: (e: React.MouseEvent, postId: number) => void;
}

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return "방금 전";
};

const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  currentUser,
  handleDeletePost,
  handleToggleLike,
}) => {
  const navigate = useNavigate();

  return (
    <main className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.postId}
          className="cursor-pointer bg-brand-default rounded-card p-4 hover:scale-101 text-left"
          onClick={() => navigate(`/community/${post.postId}`)}
        >
          {/* 게시글 상단 정보 */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={post.authorProfileUrl || DEFAULT_IMAGES.PROFILE}
              alt={post.author}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-caption-bold text-brand-text-primary">
                {post.author}
              </p>
              <p className="text-footnote text-brand-gray">
                {timeSince(new Date(post.createdAt))} ·{" "}
                <span className="font-semibold text-brand-primary">
                  {post.category}
                </span>
              </p>
            </div>
            {currentUser && currentUser.id === post.userId && (
              <button
                onClick={(e) => handleDeletePost(e, post.postId)}
                className="text-footnote text-brand-disabled hover:text-brand-error-text"
              >
                삭제
              </button>
            )}
          </div>

          {/* 게시글 본문 */}
          <div className="space-y-2">
            <h3 className="text-caption-bold text-brand-text-primary line-clamp-1">
              {post.title}
            </h3>
            <p className="text-caption text-brand-text-secondary line-clamp-3">
              {post.content}
            </p>
            {post.thumbnailUrl && (
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="rounded-lg mt-3 w-full max-h-60 object-cover"
              />
            )}
          </div>

          {/* 최신 댓글 미리보기 섹션 ⭐️ */}
          {post.comments && post.comments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-brand-frame space-y-2">
              {post.comments.map((comment) => (
                <div
                  key={comment.commentId}
                  className="flex items-center gap-2 text-footnote"
                >
                  <p className="text-brand-text-primary font-semibold">
                    {comment.user.username}
                  </p>
                  <p className="text-brand-text-secondary truncate">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 게시글 하단 정보 (좋아요, 댓글) */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-brand-frame">
            <div className="flex items-center gap-1 text-caption">
              <IconButton
                isIt={post.userLiked}
                iconName="like"
                iconSecondName="likeFill"
                iconSecondColor="text-red-500"
                iconSize={18}
                onClick={(e) => handleToggleLike(e, post.postId)}
                className="text-red-400"
              />
              <span
                className={post.userLiked ? "text-red-500" : "text-brand-gray"}
              >
                {post.likeCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-caption text-brand-gray">
              <Icon name="chat" size={18} />
              <span>{post.commentCount}</span>
            </div>
          </div>
        </article>
      ))}
    </main>
  );
};

export default CommunityFeed;
