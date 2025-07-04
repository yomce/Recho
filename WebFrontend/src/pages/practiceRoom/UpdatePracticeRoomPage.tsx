import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { type PracticeRoomType, type CreatePracticeRoomPayload, type PracticeRoom } from '@/types/practiceRoom';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import { saveLocationToDB } from '@/components/map/LocationSaveHandler';
import { useAuthStore } from '@/stores/authStore';
import { PracticeRoomForm } from '@/components/layout/pages/practiceRoom/PracticeRoomForm';

const UpdatePracticeRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [form, setForm] = useState<PracticeRoomType>({
    title: '',
    description: '',
    locationId: '',
    image: [],
  })
  const location = useLocationStore((state) => state.location);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- 기존 게시글 데이터 불러오기 -- 
  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return
    }

    const fetchPostDetail = async () => {
      setLoading(true);

      try {
        const response = await axiosInstance.get<PracticeRoom>(`practice-room/${id}`);
        const post = response.data;

        setForm({
          title: post.title,
          description: post.description,
          locationId: String(post.location.locationId),
          image: post.imageUrl ? [] : [],
        })
      } catch (err: any) {
        console.error('Failed to fetch post for update:', err);
        setError('게시글을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false);
      }
    };
    fetchPostDetail();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!location) {
      setError('지역을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try{
      // 1. locationId 먼저 저장
      const locationId = await saveLocationToDB(location);

      const payload: CreatePracticeRoomPayload = {
        ...form,
        locationId: String(locationId),
      };
      await axiosInstance.patch(`practice-room/${id}`, payload,);
      alert('게시글이 성공적으로 수정되었습니다!');
      navigate(`/practice-room/${id}`)
    }catch (err:any){
      console.error('Failed to update post:', err);
      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
        ? err.response.data.message.join('\n')
        : err.response.data.message;
        setError(messages);
      }else {
        setError(err.message || '게시글 수정 중 오류가 발생했습니다.');
      }
    }finally{
      setLoading(false);
    }
  };

  // 로딩 중이거나 에러 발생 시 UI
  if (loading) return <div className="message-container"><div className="spinner"></div></div>;
  if (error) return <div className="message-container error-message">{error}</div>;

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

export default UpdatePracticeRoomPage;