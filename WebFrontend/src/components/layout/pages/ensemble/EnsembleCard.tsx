import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/atoms/icon/Icon";
import DEFAULT_IMAGES from "@/constants/images";
import {
  SKILL_LEVEL_DIC,
  type RecruitEnsemble,
} from "@/pages/ensemble/types";

interface EnsembleCardProps {
  posts: RecruitEnsemble[];
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

const skillLevelColorMap: Record<number, string> = {
  0: "bg-green-400",
  1: "bg-blue-400",
  2: "bg-purple-400",
  3: "bg-yellow-500",
};

const EnsembleCard: React.FC<EnsembleCardProps> = ({ posts }) => {
  const navigate = useNavigate();

  return (
    <main className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.postId}
          className="cursor-pointer bg-brand-default rounded-card p-4 hover:scale-101 text-left"
          onClick={() => navigate(`/ensembles/${post.postId}`)}
        >
          {/* 유저 정보 */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={post.user.profileImageUrl || DEFAULT_IMAGES.PROFILE}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-caption-bold text-brand-text-primary">
                {post.user.username}
              </p>
              <p className="text-footnote text-brand-gray">
                {timeSince(new Date(post.createdAt))}
              </p>
            </div>
          </div>

          {/* 본문 */}
          <div className="space-y-2">
            <h3 className="text-caption-bold text-brand-text-primary line-clamp-1">
              {post.title}
            </h3>
            <p className="text-caption text-brand-text-secondary line-clamp-3">
              {post.content}
            </p>
            {post.location?.regionLevel1 && (
              <p className="text-footnote text-brand-gray">
                📍 {post.location.regionLevel1}
              </p>
            )}
          </div>

          {/* 하단 정보 */}
          <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-brand-frame text-caption text-brand-gray">
            <p
              className={`px-4 py-[1px] rounded-full text-white font-semibold ${skillLevelColorMap[post.skillLevel]}`}
            >
              {SKILL_LEVEL_DIC[post.skillLevel]}
            </p>
            {post.sessionEnsemble.map((session) => (
              <span key={session.sessionId} className="flex items-center justify-center gap-1 text-brand-gray">
                <Icon name="user" size={15}/>
                {session.nowRecruitCount}/{session.recruitCount}
              </span>
            ))}
          </div>
        </article>
      ))}
    </main>
  );
};

export default EnsembleCard;
