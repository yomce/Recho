import React from "react";
import Avatar from "../avatar/Avatar";

interface UserProfileCardProps {
  imageUrl?: string;
  name: string;
  location: string;
  status?: "판매중" | "예약중" | "판매완료";
  statusSlot?: React.ReactNode;   // 상태바 대신 버튼 같은 컴포넌트를 받을 수 있음
}

export const baseStatusStyle = "rounded-[10px] px-4 py-1 text-[14px] whitespace-nowrap";
export const defaultProfileImage = "https://recho-img.s3.ap-northeast-2.amazonaws.com/users/default_profile.jpg";

export const statusStyleMap = {
  판매중: {
    bg: "bg-[#d7e9ff]",
    text: "text-[#4397fd]",
  },
  예약중: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  판매완료: {
    bg: "bg-[#d8d4d4]",
    text: "text-black",
  },
  예약하기: {
    bg: "bg-[#d8d4d4]",
    text: "text-black",
    hover: "hover:bg-[#DDCAFC]"
  }
};

// 유효한 이미지 URL을 반환하는 헬퍼 함수
// 만약 URL이 유효하지 않으면 기본 프로필 이미지를 반환
const getValidImage = (url?: unknown): string => {
  return (typeof url === 'string' && url.trim().length > 0)
    ? url
    : defaultProfileImage;
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  imageUrl,
  name,
  location,
  status,
  statusSlot,
}) => {
  const style = status ? statusStyleMap[status] : { bg: "", text: "", hover: "" };
  
  return (
    <div className="flex items-center justify-between mt-[16px] w-full">
      <div className="flex items-center gap-4">
        {/* 프로필 이미지 */}
        <Avatar
          src={getValidImage(imageUrl)}
          size={40} 
          alt="프로필 이미지" 
        />
        {/* 텍스트 정보 */}
        <div className="flex flex-col">
          <p className="text-base text-left font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-left text-gray-500">{location}</p>
        </div>
      </div>
      { statusSlot ? (
        <>{statusSlot}</>
      ) : (
        <span
        className={`${baseStatusStyle} ${style.bg ?? ""} ${style.text ?? ""} ${'hover' in style ? style.hover : ""}`}
        >
          {status}
        </span>
      )}
    </div>
  );
};

export default UserProfileCard;
