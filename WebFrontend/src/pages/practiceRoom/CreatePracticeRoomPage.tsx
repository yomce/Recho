import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { type CreatePracticeRoomPayload, type PracticeRoomType } from '@/types/practiceRoom';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import { saveLocationToDB } from '@/components/map/LocationSaveHandler';
import { useAuthStore } from '@/stores/authStore';
import { PracticeRoomForm } from '@/components/layout/pages/practiceRoom/PracticeRoomForm';


const CreatePracticeRoom: React.FC = () => 
{
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState<PracticeRoomType>({
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
      id: user?.id
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
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">합주실 예약</h2>
      <PracticeRoomForm
        formState={form}
        onFormChange={handleChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="상품 등록하기"
        loadingButtonText="등록 중..."
      />
    </div>
  )
}

export default CreatePracticeRoom;
