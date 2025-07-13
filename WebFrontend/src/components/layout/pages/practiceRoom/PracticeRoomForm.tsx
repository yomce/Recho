import React from "react";
import LocationSelector from "../../../map/LocationSelector";
import type { PracticeRoomType } from "@/types/practiceRoom";
import ImageUploadPreview from "@/components/atoms/input/ImageUploadPreveiw";
import InputLabel from "@/components/atoms/input/InputLabel";
import TextInputForm from "@/components/atoms/input/TextInputForm";
import TextAreaInput from "@/components/atoms/input/TextAreaInput";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";

interface PracticeRoomFormProps {
  formState: PracticeRoomType;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  errorMessage: string | null;
  submitButtonText: string;
  loadingButtonText: string;
}

// 공통 입력 필드 스타일
// const inputStyles = "w-full py-3 px-4 text-base border border-gray-400 rounded-md box-border transition-all duration-200 text-gray-800 bg-gray-50 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/50";

export const PracticeRoomForm: React.FC<PracticeRoomFormProps> = ({
  formState,
  onFormChange,
  onFormSubmit,
  isLoading,
  errorMessage,
  submitButtonText,
  loadingButtonText,
}) => {
  return (
    <form onSubmit={onFormSubmit}>
      <div className="mb-6">
        <ImageUploadPreview
          refIn="PRACTICE-ROOM"
        />
      </div>
      <div className="mb-6">
        <InputLabel htmlFor="title">상호명</InputLabel>
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
        <InputLabel htmlFor="locationId">지역</InputLabel>
        <LocationSelector
          locationId={formState.locationId}
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="description">본문</InputLabel>
        <TextAreaInput
          id="description"
          name="description" 
          value={formState.description} 
          onChange={onFormChange} 
          rows={8} 
          required
        />
      </div>

      {errorMessage && (
        <p className="text-red-800 bg-red-100 border border-red-300 rounded-md p-4 text-center mb-6 whitespace-pre-wrap">
          {errorMessage}
        </p>
      )}

      <PrimaryButton
        type="submit"
        disabled={isLoading}
        className="mt-4"
        style={{ borderRadius: "10px" }}
      >
        {isLoading ? loadingButtonText : submitButtonText}
      </PrimaryButton>
    </form>
  )
}