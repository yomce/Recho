// 전역 이미지 상수 관리
import profileIcon from "@/assets/profile.svg";
import placeholder from "@/assets/placeholder.svg";

export const DEFAULT_IMAGES = {
  PROFILE: profileIcon,
  PLACEHOLDER: placeholder,
} as const;

export default DEFAULT_IMAGES;
