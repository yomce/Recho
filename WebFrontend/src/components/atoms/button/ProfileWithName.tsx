import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../avatar/Avatar";
import { DEFAULT_IMAGES } from "@/constants/images";
import type { User } from '@/stores/authStore';
// Avatar 컴포넌트의 실제 경로로 수정해주세요.

// ProfileWithName 컴포넌트가 받을 props 타입을 정의합니다.
interface ProfileWithNameProps {
  user: User;
}

const ProfileWithName: React.FC<ProfileWithNameProps> = ({ user }) => {
  const navigate = useNavigate();

  // 프로필 클릭 시 페이지 이동하는 함수
  const handleProfileClick = () => {
    if (user && user.id) {
      navigate(`/users/${user.id}`);
    }
  };

  if (!user) {
    return null; // user 정보가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px", // 아바타와 이름 사이의 간격
        cursor: "pointer",
      }}
      onClick={handleProfileClick}
    >
      <Avatar src={user.profileImageUrl || DEFAULT_IMAGES.PROFILE} size={40} alt={user.username} />
      {/* 버튼 대신 텍스트로 표시하여 스타일링 유연성 확보 */}
      <span style={{ color: "grey", fontSize: "0.9rem", fontWeight: "bold" }}>
        {user.username}
      </span>
    </div>
  );
};

export default ProfileWithName;
