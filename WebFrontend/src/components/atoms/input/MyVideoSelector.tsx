import { useEffect, useState } from 'react';
import axiosInstance from '@/services/axiosInstance';
import { type VideoPreview } from '@/types/product';

const MyVideoSelector = ({
  onSelect,
  selectedId,
}: {
  onSelect: (video: VideoPreview) => void;
  selectedId?: string;
}) => {
  const [videos, setVideos] = useState<VideoPreview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get<VideoPreview[]>(`/search-video`);
        setVideos(res.data); // ✅ 백엔드에서 [{ id, thumbnailUrl }] 형태로 응답한다고 가정
      } catch (e) {
        console.error('영상 썸네일 불러오기 실패:', e);
      }
    };

    fetchVideos();
  }, []);

  const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentVideos = videos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
      <div className="mb-6">
        <label className="block mb-2 font-semibold">내 영상 선택</label>

        <div className="grid grid-cols-3 gap-3">
          {currentVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => onSelect(video)}
              className={`cursor-pointer border rounded-md overflow-hidden ${
                selectedId === video.id ? 'ring-2 ring-brand-primary' : ''
              }`}
            >
              <img
                src={video.thumbnailUrl}
                alt="썸네일"
                className="w-full aspect-square object-cover"
              />
            </div>
          ))}
        </div>

        {/* 페이징 컨트롤 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              이전
            </button>
            <span className="px-2 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}
      </div>
    );
};


export default MyVideoSelector;