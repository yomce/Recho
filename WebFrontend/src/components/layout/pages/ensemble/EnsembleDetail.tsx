import React from "react";
import { type RecruitEnsemble } from "@/pages/ensemble/types";
import KakaoMapApi from "@/components/map/KakaoMapComponent";
import PostLayout from "../../PostLayout";
import IconButton from "@/components/atoms/button/IconButton";
import { ToastMenu } from "@/components/atoms/button/ToastMenu";
import ProfileBubble from "@/components/atoms/card/ProfileBubble";
import Icon from "@/components/atoms/icon/Icon";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";

interface RecruitEnsembleProps {
  post: RecruitEnsemble;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const INSTRUMENT = [
  "일렉기타", "베이스기타", "어쿠스틱기타", "피아노", "드럼",
];

type Participant = {
  current: number;
  max: number;
  users: { id: number; name: string; avatar: string }[];
};

// 예시 데이터: 참여 유저들
const participantMap: { [key: string]: Participant } = {
  "일렉기타": {
    current: 1,
    max: 3,
    users: [
      { id: 1, name: "김기타", avatar: "https://placehold.co/32x32" },
    ],
  },
  "피아노": {
    current: 2,
    max: 2,
    users: [
      { id: 2, name: "박피아노", avatar: "https://placehold.co/32x32" },
      { id: 3, name: "최피아노", avatar: "https://placehold.co/32x32" },
    ],
  },
  // ...
};


export const RecruitEnsembleDetail: React.FC<RecruitEnsembleProps> = ({
  post,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  return (
    <PostLayout bgClassName="bg-brand-inverse">
      <div className="relative mx-auto px-4 w-full">
        {isOwner && ( 
          <div className="absolute top-1 right-4 z-10">
            <IconButton
              iconName="moreFill"
              onClick={() =>
                ToastMenu({
                  onEdit: () => onEdit?.(),
                  onDelete: () => onDelete?.(),
                })
                }
              />
          </div>
        )}
        <ProfileBubble
          imageUrl="https://placehold.co/60x60"
          name={post.user.username}
          title={post.title}
        />
      </div>
      <div className="flex flex-col p-4 rounded-[10px] gap-2 text-brand-gray">
        <div className="flex flex-row items-center justify-start gap-2">
          <IconButton
            iconName="calendar"
            iconSize={20}
          />
          <p>{post.eventDate.slice(0,10)}</p>
        </div>
        <div className="flex flex-row items-center justify-start gap-4">
          <IconButton
            iconName="mapPin"
            iconSize={20}
          />
          <p>{post.locationId}</p>
        </div>
        <div className="flex flex-row items-center justify-start gap-4">
          <p className="px-6 py-1 rounded-full bg-brand-frame">{post.skillLevel}</p>
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words text-base leading-relaxed bg-gray-50 p-4 rounded mt-[16px]">
        {post.content}
      </pre>

      <div className="flex flex-col rounded-[10px] gap-4 mt-[16px]">
        {INSTRUMENT.map((instrument) => {
          const part = participantMap[instrument] || {current: 0, max: 0, users: []};

          return (
            <div
              key={instrument}
              className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* 제목 줄 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-brand-gray">{instrument}</span>
                </div>
                <span className="text-footnote text-gray-500">{part.current}/{part.max}</span>
              </div>
              <div className="mt-2 border-t border-brand-frame" />
              {/* 유저 목록 */}
              <div className="flex items-center justify-between gap-4 mt-2">
                {/* 유저 목록: 왼쪽에 붙어서 나열 */}
                <div className="flex items-center gap-2">
                  {part.users.map((user) => (
                    <div key={user.id} className="flex flex-col items-center">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border border-white"
                      />
                      <p className="text-footnote text-gray-500 mt-1">{user.name}</p>
                    </div>
                  ))}
                </div>
                {/* 지원하기 버튼: 오른쪽 끝 */}
                {part.current < part.max && !isOwner && (
                  <div className="max-w-[60px] whitespace-nowrap overflow-hidden">
                    <PrimaryButton style={{ fontSize: 12 }}>
                      지원하기
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PostLayout>
  )
};

export default RecruitEnsembleDetail;