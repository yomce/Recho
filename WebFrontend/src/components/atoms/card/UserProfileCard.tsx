import React from "react";
import Avatar from "../avatar/Avatar";

interface UserProfileCardProps {
  imageUrl: string;
  name: string;
  location: string;
  status: "판매중" | "예약중" | "판매완료";
}

const statusStyleMap = {
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
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  imageUrl,
  name,
  location,
  status,
}) => {
  const style = statusStyleMap[status];

  return (
    <div className="flex items-center justify-between mt-[16px] w-full">
      <div className="flex items-center gap-4">
        {/* 프로필 이미지 */}
        <Avatar
          src={imageUrl}
          size={40} 
          alt="프로필 이미지" 
        />
        {/* 텍스트 정보 */}
        <div className="flex flex-col">
          <p className="text-base text-left font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{location}</p>
        </div>
      </div>
      <span
        className={`rounded-[10px] px-4 py-1 text-[14px] whitespace-nowrap ${style.bg} ${style.text}`}
      >
        {status}
      </span>
    </div>
  );
};

export default UserProfileCard;
