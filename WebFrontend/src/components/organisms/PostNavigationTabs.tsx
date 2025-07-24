import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { motion } from 'framer-motion';
import 'swiper/css';

interface SwiperTabsProps<T> {
  tabs: string[];
  contents?: T[][];
  renderItem: (item: T) => React.ReactNode;
  loading?: boolean;
}

function SwiperTabs<T>({
  tabs,
  contents,
  renderItem,
  loading,
}: SwiperTabsProps<T>) {
  const [swiper, setSwiper] = useState<SwiperCore | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    swiper?.slideTo(index);
  };

  return (
    <div className="w-full">
      {/* 탭 버튼 */}
      <nav className="relative flex border-b border-brand-disabled">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => handleTabClick(index)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors relative
              ${activeIndex === index ? 'text-brand-primary' : 'text-brand-disabled hover:text-brand-secondary'}`}
          >
            {tab}
            {activeIndex === index && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary"
              />
            )}
          </button>
        ))}
      </nav>

      {/* 콘텐츠 영역 */}
      <Swiper
        onSwiper={setSwiper}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        className="w-full"
      >
        {contents && contents.map((items, idx) => (
          <SwiperSlide key={idx}>
            <div className="grid grid-cols-1 gap-4 px-6 py-4">
              {loading ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : items.length > 0 ? (
                items.map((item, index) => <div key={index}>{renderItem(item)}</div>)
              ) : (
                <p className="text-center text-brand-gray py-8">게시물이 없습니다.</p>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default SwiperTabs;
