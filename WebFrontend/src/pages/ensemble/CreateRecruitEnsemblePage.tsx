// src/pages/CreateRecruitEnsemblePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
import { useAuthStore } from '@/stores/authStore';
// 1. 공통 폼과 관련 타입들을 components 폴더에서 가져옵니다.
import { EnsembleForm, type RecruitEnsembleFormState, SKILL_LEVEL } from '@/pages/ensemble/components/EnsembleForm';
import axios from 'axios';
import type { SessionEnsembleFormState } from './components/SessionForm';

// 서버에 전송할 데이터 타입 (userId 포함)
interface CreateSessionEnsemblePayload {
  instrument: string;
  recruitCount: number;
}

interface CreateRecruitEnsemblePayload {
  title: string;
  content: string;
  eventDate: Date;
  skillLevel: SKILL_LEVEL;
  locationId: number;
  totalRecruitCnt: number;
  sessionList: CreateSessionEnsemblePayload[];
}

const CreateRecruitEnsemblePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 2. 폼 상태 타입으로 EnsembleFormState를 사용합니다.
  const [sessionFormList, setSessionForm] = useState<SessionEnsembleFormState[]>([{
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

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecruitChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // skillLevel 값은 숫자로 변환하여 상태에 저장합니다.
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
    if (!user) {
      setError('인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // payload 생성
      const sessionListPayLoad: CreateSessionEnsemblePayload[] = sessionFormList.map((item) => ({
        instrument: item.instrument,
        recruitCount: Number(item.recruitCount),
      }))

      const payload: CreateRecruitEnsemblePayload = {
        title: form.title,
        content: form.content,
        eventDate: new Date(form.eventDate),
        skillLevel: Number(form.skillLevel),
        locationId: Number(form.locationId),
        totalRecruitCnt: Number(form.totalRecruitCnt),
        sessionList: sessionListPayLoad,
      };

      console.log(payload)

      const response = await axiosInstance.post('ensembles', payload);
      alert('모집 공고가 성공적으로 등록되었습니다!');
      navigate(`/ensembles/${response.data.postId}`);

    } catch (err) {
        if (axios.isAxiosError(err)) {
            const messages = err.response?.data?.message;
            setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '등록 중 오류가 발생했습니다.');
        } else if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('예상치 못한 오류가 발생했습니다.');
        }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-10">로그인 페이지로 이동 중...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">합주단원 모집 공고 등록</h2>
      
      {/* 3. 복잡한 폼 UI 대신 EnsembleForm 컴포넌트를 사용합니다. */}
      <EnsembleForm
        formState={form}
        onFormChange={handleRecruitChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="모집 공고 등록하기"
        loadingButtonText="등록 중..."
        sessionFormList={sessionFormList}
        onSessionFormListChange={handleSessionChange}
        onSessionFormAdd={handleSessionAdd}
        onSessionFormRemove={handleSessionRemove}
      />
    </div>
  );
};

export default CreateRecruitEnsemblePage;