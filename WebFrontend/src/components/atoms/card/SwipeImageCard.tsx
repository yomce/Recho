import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface SwiperImageCarouselProps {
  images: string[];
  width?: number;
  height?: number;
  className?: string;
  slideClassName?: string;
  showPagination?: boolean;
  autoPlay?: boolean;
}

const SwiperImageCarousel: React.FC<SwiperImageCarouselProps> = ({
  images,
  width = 398,
  height = 270,
  className = "",
  slideClassName = "",
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
              className={`overflow-hidden rounded-[var(--radius-button)] ${slideClassName}`}
              style={{ width: "100%", height: "100%" }}
            >
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperImageCarousel;

