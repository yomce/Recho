// src/pages/CreateRecruitEnsemblePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 실제로는 axiosInstance를 사용하세요
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '@/services/axiosInstance';

// DTO를 기반으로 필요한 타입과 Enum을 정의합니다.
enum SKILL_LEVEL {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  PROFESSIONAL,
}

const SKILL_LEVEL_TEXT = {
  [SKILL_LEVEL.BEGINNER]: '초보',
  [SKILL_LEVEL.INTERMEDIATE]: '중수',
  [SKILL_LEVEL.ADVANCED]: '고수',
  [SKILL_LEVEL.PROFESSIONAL]: '전문가',
}

// 폼 상태를 위한 타입
interface RecruitEnsembleForm {
  title: string;
  content: string;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  locationId: string;
  instrumentCategoryId: string;
  totalRecruitCnt: string;
}

// 서버에 전송할 데이터 타입을 정의합니다 (DTO와 유사)
interface CreateRecruitEnsemblePayload {
  userId: string;
  title: string;
  content: string;
  eventDate: Date;
  skillLevel: SKILL_LEVEL;
  locationId: number;
  instrument_category_id: number;
  total_recruit_cnt: number;
}


const CreateRecruitEnsemblePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [form, setForm] = useState<RecruitEnsembleForm>({
    title: '',
    content: '',
    // eventDate는 yyyy-MM-dd 형식의 문자열로 관리해야 <input type="date">와 호환됩니다.
    eventDate: '',
    skillLevel: SKILL_LEVEL.BEGINNER,
    locationId: '',
    instrumentCategoryId: '',
    totalRecruitCnt: '1',
  });

  // 페이지 마운트 시 로그인 상태 확인
  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
      // DTO에 맞게 데이터 타입 변환 및 검증
      const locationIdNum = parseInt(form.locationId, 10);
      const instrumentCategoryIdNum = parseInt(form.instrumentCategoryId, 10);
      const totalRecruitCntNum = parseInt(form.totalRecruitCnt, 10);

      if (isNaN(locationIdNum) || isNaN(instrumentCategoryIdNum) || isNaN(totalRecruitCntNum)) {
        throw new Error('지역, 악기 ID 및 모집 인원에는 숫자를 입력해야 합니다.');
      }
      if (!form.eventDate) {
        throw new Error('연주 일자를 선택해주세요.');
      }

      // 서버로 보낼 payload 생성
      const payload: CreateRecruitEnsemblePayload = {
        userId: user.username, // 또는 user.username 등 스토어의 user 객체에 맞게 사용
        title: form.title,
        content: form.content,
        eventDate: new Date(form.eventDate),
        skillLevel: form.skillLevel,
        locationId: locationIdNum,
        instrument_category_id: instrumentCategoryIdNum,
        total_recruit_cnt: totalRecruitCntNum,
      };

      // API 요청 (엔드포인트는 실제 API 주소로 변경 필요)
      const response = await axiosInstance.post('ensembles', payload);
      alert('모집 공고가 성공적으로 등록되었습니다!');
      // 성공 시 생성된 게시글 상세 페이지로 이동
      navigate(`/recruit-ensembles/${response.data.id}`);

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
  
  // 공통 입력 필드 스타일
  const inputStyle = "w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  
  if (!user) {
    return <div className="text-center mt-10">로그인 페이지로 이동 중...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">합주단원 모집 공고 등록</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-semibold mb-2 text-gray-700">제목</label>
          <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required className={inputStyle} placeholder="공고 제목을 입력하세요"/>
        </div>

        <div>
          <label htmlFor="content" className="block text-lg font-semibold mb-2 text-gray-700">내용</label>
          <textarea id="content" name="content" value={form.content} onChange={handleChange} required rows={8} className={inputStyle} placeholder="모집 공고에 대한 상세 내용을 작성해주세요."/>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="eventDate" className="block text-lg font-semibold mb-2 text-gray-700">연주 일자</label>
            <input type="date" id="eventDate" name="eventDate" value={form.eventDate} onChange={handleChange} required className={inputStyle}/>
          </div>
          <div>
            <label htmlFor="skillLevel" className="block text-lg font-semibold mb-2 text-gray-700">요구 실력</label>
            <select id="skillLevel" name="skillLevel" value={form.skillLevel} onChange={handleChange} required className={inputStyle}>
              {Object.entries(SKILL_LEVEL_TEXT).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="instrumentCategoryId" className="block text-lg font-semibold mb-2 text-gray-700">악기 (ID)</label>
            <input type="number" id="instrumentCategoryId" name="instrumentCategoryId" value={form.instrumentCategoryId} onChange={handleChange} required className={inputStyle} placeholder="악기 ID"/>
          </div>
          <div>
            <label htmlFor="locationId" className="block text-lg font-semibold mb-2 text-gray-700">지역 (ID)</label>
            <input type="number" id="locationId" name="locationId" value={form.locationId} onChange={handleChange} required className={inputStyle} placeholder="지역 ID"/>
          </div>
          <div>
            <label htmlFor="totalRecruitCnt" className="block text-lg font-semibold mb-2 text-gray-700">모집 인원</label>
            <input type="number" id="totalRecruitCnt" name="totalRecruitCnt" min="1" value={form.totalRecruitCnt} onChange={handleChange} required className={inputStyle} placeholder="총 모집 인원"/>
          </div>
        </div>
        
        {error && <p className="text-center text-red-500 font-semibold bg-red-100 p-3 rounded-md">{error}</p>}

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full py-4 text-xl font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
            {loading ? '등록 중...' : '모집 공고 등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecruitEnsemblePage;