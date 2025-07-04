import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { type PracticeRoomForm, type Location, type CreatePracticeRoomPayload } from '@/types/practiceRoom';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import { saveLocationToDB } from '@/components/map/LocationSaveHandler';
import LocationSelector from '@/components/map/LocationSelector';
import { useAuthStore } from '@/stores/authStore';

/*
const mockLocations: Location[] = [
  { locationId: '1001', regionLevel1: '경기도', regionLevel2: '용인시' },
  { locationId: '1002', regionLevel1: '경기도', regionLevel2: '수원시' },
  { locationId: '2001', regionLevel1: '서울특별시', regionLevel2: '강남구' },
];
*/

const CreatePracticeRoom: React.FC = () => 
{
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState<PracticeRoomForm>({
    title: '',
    description: '',
    locationId: '',
    image: [],
  });
  const location = useLocationStore((state) => state.location);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if(!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return
    }
    setForm(prev => ({
      ...prev,
      userId: user?.username as string,
    }))
  }, [user, navigate])
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // <<< 4. `handleSubmit` 로직을 명확한 단계로 분리합니다.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!user){
      setError('인증 정보가 업습니다.');
      return;
    }
    if (!location) {
      setError('지역을 선택해주세요.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. locationId 먼저 저장
      const locationId = await saveLocationToDB(location);

      // 단계 2: API 전송을 위한 데이터 변환 (Payload 생성)
      // UsedProductForm -> CreateUsedProductPayload 타입으로 변환
      const payload: CreatePracticeRoomPayload = {
        title: form.title,
        description: form.description,
        locationId: String(locationId),
      };

      // 단계 3: API 요청
      const response = await axiosInstance.post(
        'http://localhost:3000/practice-room',
        payload, // 변환된 payload 전송
      );
      
      const newPostId = response.data.postId;
      alert('상품이 성공적으로 등록되었습니다!');
      navigate(`/practice-room/${newPostId}`);

    } catch (err: any) {
      console.error('Failed to create post:', err);
      // 에러 메시지 처리는 기존 로직 유지 (개선됨)
      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message;
        setError(messages);
      } else {
        setError(err.message || '상품 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='app-container'>
      <div className='centered-card-container'>
        <div className="w-full max-w-md bg-brand-default rounded-[20px] shadow-md p-8">
          <h2 className='text-title mb-8 text-center'>합주실 등록</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor='title' className="text-subheadline">제목</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                required
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor='description' className="text-subheadline">본문</label>
              <textarea 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={8} 
                required
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary resize-none"
              />
            </div>

            {/* 위치 선택 드롭다운 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="locationId" className="text-subheadline">지역</label>
              <LocationSelector />
            </div>

            {/* 사진 선택 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="image" className="text-subheadline">사진</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                multiple
                onChange={e => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setForm(prev => ({
                      ...prev,
                      image: Array.from(files),
                    }));
                  }
                }}
                className="border border-brand-frame rounded-[10px] px-4 py-2 text-body focus:outline-brand-primary"
              />
              {/* 미리보기 썸네일 */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.image.length > 0 &&
                  form.image.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 object-cover rounded-[10px] border"
                    />
                  ))}
              </div>
            </div>

            {/* 등록 버튼 */}
            <button
              type="submit"
              className="bg-brand-primary mt-4 w-full text-brand-text-inverse py-3 rounded-[10px]"
              disabled={loading}
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>

            {/* 에러 메시지 */}
            {error && (
              <div className="button-brand-gray mt-2"><p className="text-brand-error-text text-center">{error}</p></div>
            )}
          </form>
        </div>
      </div>
    </div>
  )

}

export default CreatePracticeRoom;
