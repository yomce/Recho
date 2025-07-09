import React from "react";

interface ImageCardProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

const ImageCard: React.FC<ImageCardProps> = ({
  src,
  alt = "페이지 대표 이미지",
  width = 398,
  height = 270,
}) => {
  const aspectRatio = width / height;

  return (
    <div className="flex justify-center items-center">
      <div
        className="overflow-hidden rounded-[var(--radius-button)]"
        style={{ width: `${width}px`, aspectRatio: `${aspectRatio}` }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ImageCard;
