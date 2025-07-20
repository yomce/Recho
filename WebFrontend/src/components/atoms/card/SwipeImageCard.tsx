import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { DEFAULT_IMAGES } from "@/constants/images";

interface SwiperImageCardProps {
  images: string[];
  width?: number;
  height?: number;
  className?: string;
  slideClassName?: string;
  imgClassName?: string;
  showPagination?: boolean;
  autoPlay?: boolean;
}

const SwiperImageCard: React.FC<SwiperImageCardProps> = ({
  images,
  // width = 398,
  // height = 270,
  className = "",
  slideClassName = "",
  imgClassName = "",
  showPagination = true,
  autoPlay = true,
}) => {
  const defaultImage = DEFAULT_IMAGES.PLACEHOLDER;
  const displayImages = images && images.length > 0 ? images : [defaultImage];

  // 이미지가 하나뿐일 때는 Swiper의 추가 기능을 비활성화하여 사용자 경험을 개선합니다.
  const enableSwiperFeatures = displayImages.length > 1;

  return (
    <div
      className={`relative mx-auto ${className}`}
      // style={{ width: `${width}px`, aspectRatio }}
    >
      <Swiper
        spaceBetween={8}
        pagination={showPagination && enableSwiperFeatures ? { clickable: true } : false}
        autoplay={autoPlay && enableSwiperFeatures ? { delay: 3000 } : false}
        loop={enableSwiperFeatures}
      >
        {displayImages.map((src, index) => (
          <SwiperSlide key={index}>
            <div
              className={`overflow-hidden ${slideClassName}`}
              style={{ width: "100%", height: "100%" }}
            >
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                className={`w-full h-full object-cover ${imgClassName}`}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperImageCard;
