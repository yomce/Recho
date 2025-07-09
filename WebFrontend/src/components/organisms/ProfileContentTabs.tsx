import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { motion } from 'framer-motion';
import 'swiper/css';

import IconButton from '../atoms/button/IconButton';

interface ProfileContentTabsProps {
  shorts: { id: string; thumbnailUrl: string }[];
  usedProducts: { id: string; thumbnailUrl: string }[];
  posts: { id: string; thumbnailUrl: string }[];
  onVinylCreateClick?: () => void;
}

const TABS = ['바이닐', '중고거래', '작성글'];

const ProfileContentTabs: React.FC<ProfileContentTabsProps> = ({ shorts, usedProducts, posts, onVinylCreateClick }) => {    
  const navigate = useNavigate();
  const [swiper, setSwiper] = useState<SwiperCore | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 각 탭에 맞는 컨텐츠 데이터와 생성 페이지 링크
  const contentData = [shorts, usedProducts, posts];
  const createLinks = ['/vinyl/create', '/used-products/create', '/posts/create'];

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    swiper?.slideTo(index);
  };

  const handleFabClick = () => {
    // 현재 탭이 '바이닐'(index 0)이면 onVinylCreateClick 함수를 호출
    if (activeIndex === 0) {
      onVinylCreateClick?.();
    } else {
      // 그 외의 탭에서는 기존처럼 페이지 이동
      navigate(createLinks[activeIndex]);
    }
  };

  return (
    <div className="relative w-full">
      {/* 탭 메뉴 */}
      <nav className="relative flex border-b border-brand-disabled">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            onClick={() => handleTabClick(index)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors 
                        ${activeIndex === index ? 'text-brand-text-primary' : 'text-brand-disabled hover:text-brand-text-secondary'}`}
          >
            {tab}
            {/* 활성 탭 밑줄 애니메이션 */}
            {activeIndex === index && (
              <motion.div className="absolute bottom-0 h-0.5 w-1/3 bg-brand-text-primary" layoutId="active-tab-underline" />
            )}
          </button>
        ))}
      </nav>

      {/* 스와이프 가능한 콘텐츠 영역 */}
      <Swiper
        onSwiper={setSwiper}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        className="w-full"
      >
        {contentData.map((items, index) => (
          <SwiperSlide key={index}>
            <div className="grid grid-cols-3">
              {items.map(item => (
                <div key={item.id} className="aspect-square cursor-pointer bg-gray-100">
                  <img src={item.thumbnailUrl} alt="thumbnail" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            {/* 컨텐츠가 없을 경우 메시지 표시 */}
            {items.length === 0 && (
                <div className='text-center py-10 text-brand-gray'>
                    게시물이 없습니다.
                </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 플러스 버튼 (Floating Action Button) */}
      <div className="fixed bottom-26 right-4 z-10 sm:right-[calc(50vw-215px+16px)]">
        <button
          onClick={handleFabClick}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105"
        >
          <IconButton iconName="plus" iconSize={32} className="!p-0 !text-white" />
        </button>
      </div>
    </div>
  );
};

export default ProfileContentTabs;