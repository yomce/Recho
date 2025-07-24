import React from "react";
import Avatar from "../avatar/Avatar";
import type { User } from '@/stores/authStore';
import DEFAULT_IMAGES from '@/constants/images';
import { useNavigate } from 'react-router-dom';

interface ProfileBubbleProps {
  user: User;
  title: string;
}

const ProfileBubble: React.FC<ProfileBubbleProps> = ({
  user,
  title,
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (user.username && user.id) {
      navigate(`/users/${user.id}`);
    }
  };

  return (
    <div 
      className="flex flex-col w-full mx-auto items-center justify-center px-4 gap-4"
      style={{
        background:
          'radial-gradient(circle at center 120px, rgb(208, 180, 253) 0%, rgba(221, 203, 249, 0.6) 40%, rgb(255, 255, 255) 90%)',
      }}>
      
      {/* 배경 + 말풍선 */}
      <div
        className="relative min-w-[430px] min-h-[200px] flex flex-col items-center justify-end"
      >
        {/* 아바타 */}
        <div className="absolute top-[60px] z-10 w-[80px] h-[80px]">
          <Avatar
            src={user.profileImageUrl || DEFAULT_IMAGES.PROFILE}
            alt="프로필 이미지"
            size={80}
            onClick={handleProfileClick}
          />
        </div>
        {/* 말풍선 */}
        <div className="mt-[120px] w-11/12 max-w-md bg-white rounded-2xl p-4 flex flex-col items-center justify-start text-center text-brand-gray border border-brand-frame gap-4">
          <p onClick={handleProfileClick} className="text-caption mt-4">{user.username}</p>
          <p className="text-[16px] font-bold line-clamp-3">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileBubble;