// src/components/EnsembleForm.tsx (새로 생성)

import React from 'react';

// 필요한 타입과 Enum을 페이지 컴포넌트에서 props로 받도록 합니다.
// 이렇게 하면 이 폼 컴포넌트는 특정 타입에 종속되지 않습니다.
export enum SKILL_LEVEL {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  PROFESSIONAL,
}

export const SKILL_LEVEL_TEXT = {
  [SKILL_LEVEL.BEGINNER]: '초보',
  [SKILL_LEVEL.INTERMEDIATE]: '중수',
  [SKILL_LEVEL.ADVANCED]: '고수',
  [SKILL_LEVEL.PROFESSIONAL]: '전문가',
};

export interface EnsembleFormState {
  title: string;
  content: string;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  locationId: string;
  instrumentCategoryId: string;
  totalRecruitCnt: string;
}

interface EnsembleFormProps {
  formState: EnsembleFormState;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  errorMessage: string | null;
  submitButtonText: string;
  loadingButtonText: string;
}

export const EnsembleForm: React.FC<EnsembleFormProps> = ({
  formState,
  onFormChange,
  onFormSubmit,
  isLoading,
  errorMessage,
  submitButtonText,
  loadingButtonText,
}) => {
  const inputStyle = "w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-lg font-semibold mb-2 text-gray-700">제목</label>
        <input type="text" id="title" name="title" value={formState.title} onChange={onFormChange} required className={inputStyle} />
      </div>

      <div>
        <label htmlFor="content" className="block text-lg font-semibold mb-2 text-gray-700">내용</label>
        <textarea id="content" name="content" value={formState.content} onChange={onFormChange} required rows={8} className={inputStyle} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="eventDate" className="block text-lg font-semibold mb-2 text-gray-700">연주 일자</label>
          <input type="date" id="eventDate" name="eventDate" value={formState.eventDate} onChange={onFormChange} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="skillLevel" className="block text-lg font-semibold mb-2 text-gray-700">요구 실력</label>
          <select id="skillLevel" name="skillLevel" value={formState.skillLevel} onChange={onFormChange} required className={inputStyle}>
            {Object.entries(SKILL_LEVEL_TEXT).map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="instrumentCategoryId" className="block text-lg font-semibold mb-2 text-gray-700">악기 (ID)</label>
          <input type="number" id="instrumentCategoryId" name="instrumentCategoryId" value={formState.instrumentCategoryId} onChange={onFormChange} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="locationId" className="block text-lg font-semibold mb-2 text-gray-700">지역 (ID)</label>
          <input type="number" id="locationId" name="locationId" value={formState.locationId} onChange={onFormChange} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="totalRecruitCnt" className="block text-lg font-semibold mb-2 text-gray-700">모집 인원</label>
          <input type="number" id="totalRecruitCnt" name="totalRecruitCnt" min="1" value={formState.totalRecruitCnt} onChange={onFormChange} required className={inputStyle} />
        </div>
      </div>
      
      {errorMessage && <p className="text-center text-red-500 font-semibold bg-red-100 p-3 rounded-md">{errorMessage}</p>}

      <div className="pt-4">
        <button type="submit" disabled={isLoading} className="w-full py-4 text-xl font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
          {isLoading ? loadingButtonText : submitButtonText}
        </button>
      </div>
    </form>
  );
};