import React from "react";

interface ImageCardProps {
  src: string;
  alt?: string;
  width?: number;   // 사용할 곳에서 지정하여 변경 가능
  height?: number;  // 사용할 곳에서 지정하여 변경 가능
  className?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  src,
  alt = "페이지 대표 이미지",
  width = 398,
  height = 270,
  className,
}) => {
  const aspectRatio = width / height;

  return (
    <div className="flex justify-center items-center">
      <div
        className={`overflow-hidden ${className ?? "rounded-[var(--radius-button)]"}`}
        style={{ width: `${width}px`, aspectRatio: `${aspectRatio}` }}
      >
        <img
          src={src}
          alt={alt}
          width={typeof width === "number" ? width : undefined}
          height={typeof height === "number" ? height : undefined}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ImageCard;
