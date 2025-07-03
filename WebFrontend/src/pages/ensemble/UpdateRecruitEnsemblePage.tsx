// src/pages/UpdateRecruitEnsemblePage.tsx (새로 생성)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useAuthStore } from '@/stores/authStore';
import { EnsembleForm, type RecruitEnsembleFormState, SKILL_LEVEL } from '@/pages/ensemble/components/EnsembleForm';
import type { SessionEnsembleFormState } from './components/SessionForm';
import type { RecruitEnsemble } from './types';

// API 응답 타입 (상세 페이지와 동일)
interface UpdateSessionEnsemblePayload {
  sessionId: number;
  instrument: string;
  recruitCount: number;
}

interface UpdateRecruitEnsemblePayload {
  title: string;
  content: string;
  eventDate: Date;
  skillLevel: SKILL_LEVEL;
  locationId: number;
  totalRecruitCnt: number;
  sessionList: UpdateSessionEnsemblePayload[];
}

const UpdateRecruitEnsemblePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [sessionFormList, setSessionForm] = useState<SessionEnsembleFormState[]>([{
    sessionId: '',
    instrument: '',
    recruitCount: '',
  }])

  const [form, setForm] = useState<RecruitEnsembleFormState>({
    title: '',
    content: '',
    eventDate: '',
    skillLevel: SKILL_LEVEL.BEGINNER,
    locationId: '',
    totalRecruitCnt: '1',
    sessionEnsemble: sessionFormList,
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

        console.log(ensemble);
        const newSessionForm : SessionEnsembleFormState[] = ensemble.sessionEnsemble.map(item => ({
          sessionId: String(item.sessionId),
          instrument: item.instrument,
          recruitCount: String(item.recruitCount),
        }))
        setSessionForm(newSessionForm)
        setForm({
          title: ensemble.title,
          content: ensemble.content,
          eventDate: formattedEventDate,
          skillLevel: ensemble.skillLevel,
          locationId: String(ensemble.locationId),
          totalRecruitCnt: String(ensemble.totalRecruitCnt),
          sessionEnsemble: newSessionForm
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

  const handleRecruitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // skillLevel은 숫자로 변환
    const processedValue = name === 'skillLevel' ? Number(value) : value;
    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSessionAdd = () => {
    setSessionForm (prev => [
      ...prev,
      { instrument: '', recruitCount: '',}
    ])
  }

  const handleSessionRemove = () => {
    if (sessionFormList.length === 1) {
      return;
    }
    setSessionForm (prev => prev.slice(0, -1));
  }

  const handleSessionChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // skillLevel 값은 숫자로 변환하여 상태에 저장합니다.
    setSessionForm(prev => {
      const newForm = [...prev];
      newForm[index] = {
        ...newForm[index],
        [name]: value,
      }
      return newForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // payload 생성 (Create 페이지와 유사하나, userId는 보내지 않음)
      const sessionListPayLoad: UpdateSessionEnsemblePayload[] = sessionFormList.map((item) => ({
        sessionId: Number(item.sessionId),
        instrument: item.instrument,
        recruitCount: Number(item.recruitCount),
      }))

      const payload: UpdateRecruitEnsemblePayload = {
        title: form.title,
        content: form.content,
        eventDate: new Date(form.eventDate),
        skillLevel: Number(form.skillLevel),
        locationId: Number(form.locationId),
        totalRecruitCnt: Number(form.totalRecruitCnt),
        sessionList: sessionListPayLoad,
      };

      console.log('patch');
      console.log(payload);

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
        onFormChange={handleRecruitChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="수정 완료"
        loadingButtonText="수정 중..."
        sessionFormList={sessionFormList}
        onSessionFormListChange={handleSessionChange}
        onSessionFormAdd={handleSessionAdd}
        onSessionFormRemove={handleSessionRemove}
      />
    </div>
  );
};

export default UpdateRecruitEnsemblePage;