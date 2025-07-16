import axiosInstance from '@/services/axiosInstance';
import { isAxiosError } from 'axios';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

const deletePromotionsByIds = async (ids: string[]): Promise<void> => {
  await axiosInstance.post('promotions/batch-delete', {ids});
};

interface DeletePromotionFormProps {
  onSuccess?: () => void;
}

export const DeletePromotionForm = ({ onSuccess }: DeletePromotionFormProps) => {
  const [idInput, setIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 쉼표로 구분된 ID를 배열로 변환하고, 각 ID의 앞뒤 공백을 제거하며, 빈 값은 필터링
    const ids = idInput.split(',').map(id => id.trim()).filter(id => id);

    if (ids.length === 0) {
      toast.error("삭제할 프로모션의 ID를 입력해주세요.");
      return;
    }

    if (!window.confirm(`정말로 ${ids.length}개의 프로모션을 삭제하시겠습니까?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('delete ids');
      console.log(ids);
      await deletePromotionsByIds(ids);
      toast.success(`${ids.length}개의 프로모션이 성공적으로 삭제되었습니다!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      let errorMessage = "삭제 중 오류가 발생했습니다.";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h3 className="text-subheadline font-bold">프로모션 일괄 삭제</h3>
      <div>
        <label className="text-caption font-medium">프로모션 ID</label>
        <textarea 
          value={idInput} 
          onChange={(e) => setIdInput(e.target.value)} 
          placeholder="삭제할 ID들을 쉼표(,)로 구분하여 입력하세요."
          disabled={isSubmitting} 
          className="mt-1 h-24 w-full rounded border p-2"
        />
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-2 rounded bg-brand-danger p-3 text-white transition hover:bg-red-700 disabled:bg-gray-300">
        {isSubmitting ? '삭제 중...' : `총 ${idInput.split(',').map(id => id.trim()).filter(id => id).length}개 삭제하기`}
      </button>
    </form>
  );
};