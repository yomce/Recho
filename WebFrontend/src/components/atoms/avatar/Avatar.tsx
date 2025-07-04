import React from 'react';

interface AvatarProps {
  /** 이미지 URL 주소입니다. */
  src: string;
  /** 아바타의 크기(px)입니다. */
  size?: number;
  /** 이미지 설명을 위한 alt 텍스트입니다. */
  alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, size = 32, alt = 'profile image' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className="rounded-full object-cover"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

export default Avatar;