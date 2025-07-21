import React from "react";
import {
  RECRUIT_STATUS,
  SKILL_LEVEL_DIC,
  type RecruitEnsemble,
} from "@/pages/ensemble/types";
import PostLayout from "../../PostLayout";
import IconButton from "@/components/atoms/button/IconButton";
import { ToastMenu } from "@/components/atoms/button/ToastMenu";
import ProfileBubble from "@/components/atoms/card/ProfileBubble";
import { SessionDetail } from "@/pages/ensemble/components/SessionDetail";
import { type ApplicationEnsemble } from "@/pages/ensemble/types";
import DEFAULT_IMAGES from '@/constants/images';

interface RecruitEnsembleProps {
  post: RecruitEnsemble;
  isOwner?: boolean;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  applicationEnsembleList: ApplicationEnsemble[];
  isApplied: boolean;
  totalUnreadCount?: number;
  fetchApplicationList: () => Promise<void>;
}

const skillLevelColorMap: Record<number, string> = {
  0: "bg-green-400",
  1: "bg-blue-400",
  2: "bg-purple-400",
  3: "bg-yellow-500",
};

export const RecruitEnsembleDetail: React.FC<RecruitEnsembleProps> = ({
  post,
  isOwner = false,
  onEdit,
  onComplete,
  onDelete,
  applicationEnsembleList,
  isApplied,
  totalUnreadCount,
  fetchApplicationList,
}) => {
  return (
    <PostLayout totalUnreadCount={totalUnreadCount} bgClassName="bg-brand-inverse">
      <div className="relative mx-auto px-4 w-full">
        {isOwner && (
          <div className="absolute top-1 right-4 z-10">
            {post.recruitStatus === RECRUIT_STATUS.RECRUITING ? (
              <IconButton
                iconName="moreFill"
                onClick={() =>
                  ToastMenu({
                    onEdit: () => onEdit?.(),
                    onComplete: () => onComplete?.(),
                    onDelete: () => onDelete?.(),
                  })
                }
              />
            ) : (
              <IconButton
                iconName="moreFill"
                onClick={() =>
                  ToastMenu({
                    onEdit: () => onEdit?.(),
                    onDelete: () => onDelete?.(),
                  })
                }
              />
            )}
          </div>
        )}
        <ProfileBubble
          imageUrl={post.user.profileImageUrl || DEFAULT_IMAGES.PROFILE}
          name={post.user.username}
          title={post.title}
        />
      </div>
      <div className="flex flex-col p-4 rounded-[10px] gap-2 text-brand-gray">
        <div className="flex flex-row items-center justify-start gap-2">
          <IconButton iconName="calendar" iconSize={20} />
          <p>{post.eventDate.slice(0, 10)}</p>
        </div>
        <div className="flex flex-row items-center justify-start gap-2">
          <IconButton iconName="mapPin" iconSize={20} />
          <p>{post.location.place_name}</p>
        </div>
        <div className="flex flex-row items-center justify-start gap-2">
          <p
            className={`px-6 py-1 rounded-full text-white font-semibold ${skillLevelColorMap[post.skillLevel]}`}
          >
            {SKILL_LEVEL_DIC[post.skillLevel]}
          </p>
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words text-base leading-relaxed bg-gray-50 p-4 rounded mt-[16px]">
        {post.content}
      </pre>
        {
          post.recruitStatus !== RECRUIT_STATUS.RECRUITING &&
          <p>이 공고는 종료되었습니다.</p>
        }
        {
          post.sessionEnsemble.map((session) => (
              <SessionDetail
                key={session.sessionId}
                item={session}
                ensemble={post}
                applicationEnsembleList={applicationEnsembleList}
                isApplied={isApplied}
                fetchApplicationList={fetchApplicationList}
              />
            ))
        }
    </PostLayout>
  );
};

export default RecruitEnsembleDetail;
