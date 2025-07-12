// src/components/EnsembleForm.tsx

import React, { useState } from 'react';
import { SessionForm, type SessionEnsembleFormState } from './SessionForm';
import LocationSelector from '@/components/map/LocationSelector';
import InputLabel from '@/components/atoms/input/InputLabel';
import TextInputForm from '@/components/atoms/input/TextInputForm';
import TextAreaInput from '@/components/atoms/input/TextAreaInput';
import CustomDatePicker from '@/components/atoms/input/CustomDatePicker';
import CategorySelector from '@/components/atoms/input/CategorySelector';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';

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

type CategoryOption = { id: string; name: string };

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    console.log('selectedDate:', date); // ← 콘솔에 찍힘

    setSelectedDate(date);

    if (date) {
      const formatted = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
      onFormChange({
        target: {
          name: 'eventDate',
          value: formatted,
        },
      } as React.ChangeEvent<HTMLInputElement>); // 타입 캐스팅
    }
  };

  const SKILL_CATEGORIES: CategoryOption[] = Object.entries(SKILL_LEVEL_TEXT).map(
    ([id, name]) => ({ id: id.toString(), name }) // 👈 key를 string으로 변환
  );

  return (
    <form onSubmit={onFormSubmit}>
      <div className="mb-6">
        <InputLabel htmlFor="title">제목</InputLabel>
        <TextInputForm
          type="text"
          id="title"
          name="title"
          value={formState.title}
          onChange={onFormChange}
          required
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="content">내용</InputLabel>
        <TextAreaInput
          id="content" 
          name="content" 
          value={formState.content} 
          onChange={onFormChange} 
          rows={8}
          required 
        />
      </div>
      <div className="mb-6">
        <InputLabel htmlFor="eventDate">연주 일자</InputLabel>
        <CustomDatePicker
          selectedDate={selectedDate}
          onChange={handleDateChange}
        />
        {/* <input type="date" id="eventDate" name="eventDate" value={formState.eventDate} onChange={onFormChange} required /> */}
      </div>
      <div className="mb-6">
        <InputLabel htmlFor="skillLevel">요구 실력</InputLabel>
        <CategorySelector
          name="skillLevel"
          value={formState.skillLevel.toString()} // enum 값 (숫자)을 문자열로 변환
          onChange={onFormChange}
          categories={SKILL_CATEGORIES}
          showSubCategory={false}
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="locationId">지역</InputLabel>
        <LocationSelector
          locationId={formState.locationId}
        />
      </div>
      
      {errorMessage && <p className="text-center text-red-500 font-semibold bg-red-100 p-3 rounded-md">{errorMessage}</p>}

      {/* 👇 2. 세션 폼을 순회하는 부분 수정 */}
      {sessionFormList.map((item, index) => (
        <div key={index}>
          <SessionForm
            item={item}
            index={index}
            onSessionFormListChange={onSessionFormListChange}
            onRemove={() => onSessionFormRemove(index)}
          />
        </div>
      ))}

      <div className="py-6">
        <PrimaryButton
          type="button"
          onClick={onSessionFormAdd}
          style={{ borderRadius: "10px", background: "#4397FD" }}
        >
          세션 추가하기
        </PrimaryButton>
      </div>

      <div className="">
        <PrimaryButton
          type="submit"
          disabled={isLoading}
          style={{ borderRadius: "10px" }}
        >
          {isLoading ? loadingButtonText : submitButtonText}
        </PrimaryButton>
      </div>
    </form>
  );
};