import React from 'react'
import { type PracticeRoom } from '@/types/practiceRoom';
import { Link } from 'react-router-dom'
import KakaoMapApi from '../../../map/KakaoMapComponent';

interface PracticeRoomDetailProps {
  post: PracticeRoom;
  isOwner?:boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PracticeRoomDetail: React.FC<PracticeRoomDetailProps> = ({
  post,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="max-w-5xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg text-slate-800">
      <div className="flex flex-col md:flex-row md:gap-12">
        {/* 이미지 섹션 */}
        <div className="md:flex-1 md:max-w-md">
          <img
            src={post.imageUrl || 'https://placehold.co/600x400'}
            alt={post.title}
            className="w-full h-auto rounded-lg border border-gray-200"
          />
        </div>

        {/* 정보 섹션 */}
        <div className="mt-6 md:mt-0 md:flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <div className="my-4 text-base text-gray-600 leading-relaxed">
            <p className="my-2">
              <strong>작성자:</strong> {post.id}
            </p>

            <p className="my-2">
              <strong>등록일:</strong> {post.createdAt}
            </p>

            <p className="my-2">
              <strong>주소:</strong> {post.location?.address}
            </p>
          </div>
          
          {post.location?.lat && post.location?.lng && (
            <div className='my-4'>
              <h3 className="text-lg font-semibold mb-2">지도 미리보기</h3>
              <div className="border rounded-lg overflow-hidden">
                <KakaoMapApi lat={post.location.lat} lng={post.location.lng} />
              </div>

              {/* 지도 페이지로 이동 버튼 */}
              <button
                type="button"
                className="text-sm text-white font-semibold bg-blue-500 py-2 px-2 rounded-lg mt-8 hover:bg-blue-700"
                onClick={() =>
                  window.open(`/map-view?lat=${post.location.lat}&lng=${post.location.lng}`, "_blank")
                }
              >
                지도에서 크게 보기
              </button>
            </div>
          )}
          <div className="mt-4">
            <h2 className="text-lg font-bold border-b-2 border-gray-100 pb-2 mb-4">설명</h2>
            <pre className="whitespace-pre-wrap break-words text-base leading-relaxed text-gray-800 bg-gray-50 p-4 rounded">
              {post.description}
            </pre>
          </div>

          <div className="mt-auto pt-6 flex justify-between items-center border-t border-gray-200">
            <Link
              to="/practice-room"
              className="py-3 px-6 border border-gray-400 rounded-md font-semibold bg-white text-gray-700 no-underline transition-all hover:bg-gray-50 hover:text-black"
            >
              목록으로
            </Link>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="py-2 px-5 rounded-md font-semibold text-white bg-blue-500 cursor-pointer transition-colors hover:bg-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={onDelete}
                  className="py-2 px-5 rounded-md font-semibold text-white bg-red-600 cursor-pointer transition-colors hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}