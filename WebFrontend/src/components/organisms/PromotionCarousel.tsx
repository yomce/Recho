// src/components/organisms/PromotionCarousel.tsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Swiper 스타일 임포트

// 캐러셀에 들어갈 아이템의 데이터 타입을 정의합니다.
interface PromotionItem {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
}

// 컴포넌트가 받을 props 타입을 정의합니다.
interface PromotionCarouselProps {
  items: PromotionItem[];
}

const PromotionCarousel: React.FC<PromotionCarouselProps> = ({ items }) => {
  return (
    <Swiper
      slidesPerView={'auto'} // 슬라이드가 콘텐츠 너비만큼 차지하도록 설정
      spaceBetween={16}      // 슬라이드 사이의 간격 (16px)
      slidesOffsetBefore={16} // 첫 슬라이드 시작 전 여백
      slidesOffsetAfter={16}  // 마지막 슬라이드 끝난 후 여백
    >
      {items.map((item) => (
        <SwiperSlide key={item.id} style={{ width: '80%' }}> {/* 각 슬라이드의 너비 */}
          <div className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg">
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4 text-white">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-1 text-sm">{item.subtitle}</p>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default PromotionCarousel;