// src/components/EnsembleForm.tsx

import React from 'react';
import { SessionForm, type SessionEnsembleFormState } from './SessionForm';

// 필요한 타입과 Enum (이전과 동일)
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

export interface RecruitEnsembleFormState {
  title: string;
  content: string;
  eventDate: string;
  skillLevel: SKILL_LEVEL;
  locationId: string;
  totalRecruitCnt: string;
  sessionEnsemble: SessionEnsembleFormState[];
}

interface RecruitEnsembleFormProps {
  formState: RecruitEnsembleFormState;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  errorMessage: string | null;
  submitButtonText: string;
  loadingButtonText: string;
  sessionFormList: SessionEnsembleFormState[];
  onSessionFormListChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSessionFormAdd: () => void;
  // 👇 1. onSessionFormRemove prop이 인덱스를 받도록 수정합니다.
  onSessionFormRemove: (index: number) => void;
}

export const EnsembleForm: React.FC<RecruitEnsembleFormProps> = ({
  formState,
  onFormChange,
  onFormSubmit,
  isLoading,
  errorMessage,
  submitButtonText,
  loadingButtonText,
  sessionFormList,
  onSessionFormListChange,
  onSessionFormAdd,
  onSessionFormRemove,
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
          <label htmlFor="locationId" className="block text-lg font-semibold mb-2 text-gray-700">지역 (ID)</label>
          <input type="number" id="locationId" name="locationId" value={formState.locationId} onChange={onFormChange} required className={inputStyle} />
        </div>
      </div>
      
      {errorMessage && <p className="text-center text-red-500 font-semibold bg-red-100 p-3 rounded-md">{errorMessage}</p>}

      {/* 👇 2. 세션 폼을 순회하는 부분 수정 */}
      {sessionFormList.map((item, index) => (
        <div key={index} className="p-4 border rounded-xl shadow-sm bg-white">
          <SessionForm
            item={item}
            index={index}
            onSessionFormListChange={onSessionFormListChange}
          />
          <div className="mt-4 text-right"> {/* 버튼을 오른쪽 정렬하기 위한 컨테이너 */}
            <button
              type="button"
              onClick={() => onSessionFormRemove(index)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              aria-label={`${index + 1}번째 세션 삭제`}
            >
              삭제
            </button>
          </div>
        </div>
      ))}

      <div className="pt-1">
        <button type="button" onClick={onSessionFormAdd} className="w-full py-2 text-xl font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors">
          세션 추가하기
        </button>
      </div>

      <div className="pt-4">
        <button type="submit" disabled={isLoading} className="w-full py-4 text-xl font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
          {isLoading ? loadingButtonText : submitButtonText}
        </button>
      </div>
    </form>
  );
};