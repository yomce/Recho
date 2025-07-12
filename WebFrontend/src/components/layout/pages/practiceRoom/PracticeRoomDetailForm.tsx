import React from 'react'
import { type PracticeRoom } from '@/types/practiceRoom';
import KakaoMapApi from '../../../map/KakaoMapComponent';
import PostLayout from '../../PostLayout';
import SwiperImageCard from '@/components/atoms/card/SwipeImageCard';
import UserProfileCard from '@/components/atoms/card/UserProfileCard';
import MapPreviewCard from '@/components/atoms/card/MapViewCard';
import IconButton from '@/components/atoms/button/IconButton';
import { baseStatusStyle, statusStyleMap } from '@/components/atoms/card/UserProfileCard';
import { ToastMenu } from '@/components/atoms/button/ToastMenu';

interface PracticeRoomDetailProps {
  post: PracticeRoom;
  isOwner?:boolean;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

const styles = statusStyleMap["예약하기"];

export const PracticeRoomDetail: React.FC<PracticeRoomDetailProps> = ({
  post,
  isOwner = false,
  onEdit,
  onComplete,
  onDelete,
}) => {
  return (
    <PostLayout bgClassName="bg-brand-inverse">
      <div className="mx-auto p-4 w-full">
        <div className="relative">
        {/* 이미지 섹션 */}
          <SwiperImageCard
            images={[
              "https://placehold.co/400x270/EEE/333?text=1",
              "https://placehold.co/400x270/DDD/333?text=2",
              "https://placehold.co/400x270/CCC/333?text=3"
            ]}
            slideClassName="rounded-[var(--radius-card)]"
            showPagination={true}
          />
          {isOwner && (
            <div className="absolute top-1 right-4 z-10">
              <IconButton
              iconName="moreFill"
              onClick={() =>
                ToastMenu({
                  onEdit: () => onEdit?.(),
                  onComplete: () => onComplete?.(),
                  onDelete: () => onDelete?.(),
                })
                }
              />
            </div>
          )}
        </div>
        <div className="flex flex-col w-full mx-auto px-4 gap-4">
          <UserProfileCard
            imageUrl={post.imageUrl || 'https://placehold.co/40x40'}
            name={post.id}
            location={post.location.address}
            statusSlot={<button className={`${baseStatusStyle} ${styles.bg} ${styles.text} ${styles.hover}`}>예약하기</button>}
          />

          {/* 정보 섹션 */}
          <div className="text-left flex flex-row justify-between items-center mt-8">
            <h1 className="text-headline mb-2">{post.title}</h1>
            <IconButton iconName="likeFill" iconSize={24} className="text-brand-disabled"/>
          </div>
          <pre className="whitespace-pre-wrap break-words text-base leading-relaxed text-gray-800 bg-gray-50 p-4 rounded">
              {post.description}
          </pre>
          
          {post.location?.lat && post.location?.lng && (
            <div className="border-t border-gray-200 mt-4 py-4">
              <KakaoMapApi lat={post.location.lat} lng={post.location.lng} />

              {/* 지도 페이지로 이동 버튼 */}
              {post.location?.lat && post.location?.lng && (
                <div>
                  <p className="text-body text-left">위치 상세</p>
                  <MapPreviewCard
                    lat={post.location.lat}
                    lng={post.location.lng}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PostLayout>
  )
}