import { useEffect, useState } from 'react';
import axiosInstance from '@/services/axiosInstance';
import Icon from "../icon/Icon";


interface VideoPreview {
  id: number;
  refIn: string;
  refPostId: number;
  video_id: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

interface VideoPreviewCardProps {
  refIn: string;
  refPostId: number;
}

const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  refIn,
  refPostId,
}) => {
  const [preview, setPreview] = useState<VideoPreview | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await axiosInstance.get<VideoPreview>(
          `/search-video/preview?refIn=${refIn}&refPostId=${refPostId}`
        );
        if (!res.data) {
          console.warn('콘텐츠가 없습니다.');
          return;
        }
        setPreview(res.data);
      } catch (err) {
        console.warn('영상 미리보기 불러오기 실패:', err);
      }
    };

    fetchPreview();
  }, [refIn, refPostId]);

  const handleVideoOpen = () => {
    if (!preview?.video_id) return;
    const url = `/vinyl/${preview.video_id}`;
    window.open(url, "_blank");
  };

  if (!preview) return null;

  return (
    <div className="relative py-4 w-full mb-40">
      <div className="w-full aspect-square bg-black rounded-[10px] flex items-center justify-center overflow-hidden p-2">
        <img
          src={preview.thumbnailUrl}
          alt="썸네일"
          className="w-full h-full object-cover"
        />
      </div>
      
      <button
        onClick={handleVideoOpen}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div className="w-[80px] h-[80px] rounded-full hover:bg-white transition">
          <Icon name="play" className="w-[80px] h-[80px] text-brand-primary" />
        </div>
      </button>
    </div>
  );
};

export default VideoPreviewCard;
