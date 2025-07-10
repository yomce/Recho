import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

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
  width = 398,
  height = 270,
  className = "",
  slideClassName = "",
  imgClassName = "",
  showPagination = true,
  autoPlay = true,
}) => {
  const aspectRatio = width / height;

  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{ width: `${width}px`, aspectRatio }}
    >
      <Swiper
        spaceBetween={8}
        pagination={showPagination ? { clickable: true } : false}
        autoplay={autoPlay ? { delay: 3000 } : false}
        loop
      >
        {images.map((src, index) => (
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

