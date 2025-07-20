import React from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../icon/Icon";
import { RECRUIT_STATUS, RECRUIT_STATUS_LABEL, SKILL_LEVEL, SKILL_LEVEL_DIC } from '@/pages/ensemble/types';
import { DEFAULT_IMAGES } from "@/constants/images";

interface PostCardProps {
  id: number | string;
  title?: string;
  description?: string;
  price?: number;
  location?: number | string;
  address?: string;
  eventDate?: string;
  recruitStatus?: RECRUIT_STATUS
  totalRecruitCnt?: number;
  imageUrl?: string | string[];

  skillLevel?: SKILL_LEVEL
  currentRecruitCnt?: number;

  imagePosition?: "left" | "right";
  imgWidth?: number;
  imgHeight?: number;

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
  eventDateClassName?: string;
  recruitStatusClassName?: string;
  totalRecruitCntClassName?: string;
  skillLevelClassName?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  description = "",
  price,
  address,
  eventDate,
  skillLevel,
  recruitStatus,
  totalRecruitCnt,
  imageUrl = "",
  imagePosition = "right",
  imgWidth = 120,
  imgHeight = 120,

  containerClassName = "",
  linkClassName = "block",
  cardClassName = "flex items-start justify-between border border-gray-200 rounded-[var(--radius-card)] h-[120px] bg-white",
  imageWrapperClassName = "bg-gray-200 rounded-[16px]",
  imageClassName = "w-full h-full object-cover",
  textWrapperClassName = "flex flex-col min-w-0 p-4 mt-1 items-start",
  titleClassName = "text-body font-semibold mb-1 line-clamp-1 text-gray-900",
  descriptionClassName = "text-footnote text-left text-gray-500 mb-2 line-clamp-1",
  priceWrapperClassName = "text-[16px] font-bold mt-2 flex items-center gap-1",
  priceTextClassName = "truncate max-w-[160px] inline-block",
  priceUnitClassName = "",
  eventDateClassName = "text-caption text-brand-gray",
  recruitStatusClassName = "text-caption text-brand-gray",
  totalRecruitCntClassName = "flex flex-row items-center gap-2 text-caption text-brand-gray",
  skillLevelClassName = `flex flex-row items-center gap-2 text-caption text-brand-gray justify-end`,
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
        src={
          Array.isArray(imageUrl)
          ? imageUrl[0] || DEFAULT_IMAGES.PLACEHOLDER
          : imageUrl || DEFAULT_IMAGES.PLACEHOLDER
        }
        alt="썸네일"
        className={imageClassName}
      />
    </div>
  );

  const textContent = (
    <div className={textWrapperClassName}>
      {recruitStatus !== undefined && <span className={recruitStatusClassName}>{RECRUIT_STATUS_LABEL[recruitStatus]}</span>}
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
      <p className={eventDateClassName}>{eventDate}</p>
      { totalRecruitCnt && (
        <p className={totalRecruitCntClassName}>
          <Icon name="user" size={16} className="text-brand-gray"/>
          {totalRecruitCnt} 명 참여
        </p>
      )}
      {skillLevel !== undefined && <span className={skillLevelClassName}>{SKILL_LEVEL_DIC[skillLevel]}</span>}

    </div>
  );

  return (
    <div className={`w-full h-full ${containerClassName}`}>
      <Link to={linkUrl} className={linkClassName}>
        <div className={`flex items-start justify-between rounded-[var(--radius-card)] ${cardClassName}`}>
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
