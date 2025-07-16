import { useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import type { PromotionPost } from '@/types/promotion';
import axiosInstance from '@/services/axiosInstance';

// API 요청 함수
const postManualPromotion = async (promotionData: PromotionPost) => {
  const response = await axiosInstance.post('promotions', promotionData);
  return response.data;
};

// 컴포넌트 Props 타입 정의
interface PromotionManualFormProps {
  onSuccess?: () => void; // ✅ 성공 시 호출될 콜백 함수
}

// 수동 입력을 위한 리액트 폼 컴포넌트
export const PromotionManualForm = ({ onSuccess }: PromotionManualFormProps) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      toast.error("제목과 이미지 URL은 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const promotionData = { title, imageUrl, subtitle: subtitle || undefined };
      await postManualPromotion(promotionData);
      
      toast.success("프로모션이 성공적으로 추가되었습니다!");
      
      // ✅ props로 받은 onSuccess 함수를 호출
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error((error as any).response?.data?.message || "프로모션 추가 중 오류 발생");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h3 className="text-subheadline font-bold">프로모션 추가</h3>
      <div>
        <label className="text-caption font-medium">공연 제목</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} className="mt-1 w-full rounded border p-2" />
      </div>
      <div>
        <label className="text-caption font-medium">이미지 URL</label>
        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isSubmitting} className="mt-1 w-full rounded border p-2" />
      </div>
      <div>
        <label className="text-caption font-medium">공연 기간 (선택)</label>
        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} disabled={isSubmitting} className="mt-1 w-full rounded border p-2" />
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-2 rounded bg-brand-primary p-3 text-white transition hover:bg-brand-dark disabled:bg-gray-300">
        {isSubmitting ? '처리 중...' : '추가하기'}
      </button>
    </form>
  );
};