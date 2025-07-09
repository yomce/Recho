import React from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../icon/Icon";

interface PostCardProps {
  id: number | string;
  title?: string;
  description?: string;
  price?: number;
  location?: number | string;
  address?: string;
  imageUrl?: string;

  imagePosition?: "left" | "right";
  imgWidth?: number;
  imgHeight?: number;

  // 커스텀 클래스
  containerClassName?: string;
  linkClassName?: string;
  cardClassName?: string;
  imageWrapperClassName?: string;
  imageClassName?: string;
  textWrapperClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  priceWrapperClassName?: string;
  priceTextClassName?: string;
  priceUnitClassName?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  description = "",
  price,
  address,
  imageUrl = "",
  imagePosition = "right",
  imgWidth = 120,
  imgHeight = 120,

  containerClassName = "",
  linkClassName = "block",
  cardClassName = "flex items-start justify-between border border-gray-200 rounded-[var(--radius-card)] h-[120px]",
  imageWrapperClassName = "bg-gray-200 rounded-[16px]",
  imageClassName = "w-full h-full object-cover",
  textWrapperClassName = "flex flex-col min-w-0 p-4 mt-1 items-start",
  titleClassName = "text-body font-semibold mb-1 line-clamp-1 text-gray-900",
  descriptionClassName = "text-footnote text-left text-gray-500 mb-2 line-clamp-1",
  priceWrapperClassName = "text-[16px] font-bold mt-2 flex items-center gap-1",
  priceTextClassName = "truncate max-w-[160px] inline-block",
  priceUnitClassName = "",
}) => {
  const location = useLocation();
  const width = imgWidth;
  const height = imgHeight;
  const linkUrl = `${location.pathname.replace(/\/$/, "")}/${id}`;

  const imageElement = (
    <div
      style={{ width, height }}
      className={`flex-shrink-0 overflow-hidden ${imageWrapperClassName}`}
    >
      <img
        src={imageUrl || "https://placehold.co/120x120"}
        alt="썸네일"
        className={imageClassName}
      />
    </div>
  );

  const textContent = (
    <div className={textWrapperClassName}>
      {title && <h2 className={titleClassName}>{title}</h2>}
      {description && <p className={descriptionClassName}>{description}</p>}
      {address && 
        <p className="text-caption text-brand-gray flex flex-row items-center truncate">
          <Icon name="mapPin" size={16} className="mr-1" />
          {address}
        </p>
      }
      {price !== undefined && (
        <span className={priceWrapperClassName}>
          <span className={priceTextClassName}>{price.toLocaleString()}</span>
          <span className={priceUnitClassName}>원</span>
        </span>
      )}
    </div>
  );

  return (
    <div className={`w-full h-full ${containerClassName}`}>
      <Link to={linkUrl} className={linkClassName}>
        <div className={`flex items-start justify-between border border-gray-200 rounded-[var(--radius-card)] h-[120px] ${cardClassName}`}>
          {imagePosition === "left" ? (
            <>
              {imageElement}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageElement}
            </>
          )}
        </div>
      </Link>
    </div>
  );
};

export default PostCard;
