// src/pages/UpdateRecruitEnsemblePage.tsx (새로 생성)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useAuthStore } from '@/stores/authStore';
import { EnsembleForm, type RecruitEnsembleFormState, SKILL_LEVEL } from '@/pages/ensemble/components/EnsembleForm';

// API 응답 타입 (상세 페이지와 동일)
interface RecruitEnsemble {
  postId: number;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  recruit_status: number;
  total_recruit_cnt: number;
  viewCount: number;
  locationId: number;
  instrument_category_id: number;
}

const UpdateRecruitEnsemblePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [form, setForm] = useState<RecruitEnsembleFormState>({
    title: '',
    content: '',
    eventDate: '',
    skillLevel: SKILL_LEVEL.BEGINNER,
    locationId: '',
    instrumentCategoryId: '',
    totalRecruitCnt: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnsemble = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<RecruitEnsemble>(`ensembles/${id}`);
        const ensemble = response.data;

        // --- 작성자 본인 확인 ---
        if (user?.username !== ensemble.userId) {
          alert('수정 권한이 없습니다.');
          navigate(`/ensembles/${id}`);
          return;
        }

        // --- 폼 상태 설정 ---
        // eventDate는 'YYYY-MM-DD' 형식으로 변환해야 <input type="date">에 표시됩니다.
        const formattedEventDate = new Date(ensemble.eventDate).toISOString().split('T')[0];

        setForm({
          title: ensemble.title,
          content: ensemble.content,
          eventDate: formattedEventDate,
          skillLevel: ensemble.skillLevel,
          locationId: String(ensemble.locationId),
          instrumentCategoryId: String(ensemble.instrument_category_id),
          totalRecruitCnt: String(ensemble.total_recruit_cnt),
        });

      } catch (err) {
        setError('게시글 정보를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnsemble();
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // skillLevel은 숫자로 변환
    const processedValue = name === 'skillLevel' ? Number(value) : value;
    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // payload 생성 (Create 페이지와 유사하나, userId는 보내지 않음)
      const payload = {
        title: form.title,
        content: form.content,
        eventDate: new Date(form.eventDate),
        skillLevel: Number(form.skillLevel),
        locationId: Number(form.locationId),
        instrument_category_id: Number(form.instrumentCategoryId),
        total_recruit_cnt: Number(form.totalRecruitCnt),
      };

      // PATCH 메서드로 수정 요청
      await axiosInstance.patch(`ensembles/${id}`, payload);
      alert('모집 공고가 성공적으로 수정되었습니다!');
      navigate(`/ensembles/${id}`);

    } catch (err) {
      setError('수정 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">모집 공고 수정</h2>
      <EnsembleForm
        formState={form}
        onFormChange={handleChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="수정 완료"
        loadingButtonText="수정 중..."
      />
    </div>
  );
};

export default UpdateRecruitEnsemblePage;