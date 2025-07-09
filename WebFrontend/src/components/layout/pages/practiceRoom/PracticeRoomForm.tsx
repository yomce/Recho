import React from "react";
import LocationSelector from "../../../map/LocationSelector";
import type { PracticeRoomType } from "@/types/practiceRoom";

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
const inputStyles = "w-full py-3 px-4 text-base border border-gray-400 rounded-md box-border transition-all duration-200 text-gray-800 bg-gray-50 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/50";

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
        <label htmlFor='title' className="text-subheadline">제목</label>
        <input 
          type="text" 
          id="title" 
          name="title" 
          value={formState.title} 
          onChange={onFormChange} 
          required
          className={inputStyles}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="locationId" className="text-subheadline">지역</label>
        <LocationSelector />
      </div>

      <div className="mb-6">
        <label htmlFor='description' className="text-subheadline">본문</label>
        <textarea 
          id="description" 
          name="description" 
          value={formState.description} 
          onChange={onFormChange} 
          rows={8} 
          required
          className={inputStyles}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="image" className="text-subheadline">사진</label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          multiple
          // onChange={onFormChange}
          onChange={ e => {
            const files = e.target.files;
            if(files && files.length > 0){
              const fileArray = Array.from(files);
              onFormChange({
                target: {
                  name: "image",
                  value: fileArray,
                }
              } as any)
            }
          }}
          className={inputStyles}
        />
      </div>

      <div>
        {formState.image && formState.image.length > 0 &&
          formState.image.map((file: File, idx: number) => (
          <img
            key={idx}
            src={URL.createObjectURL(file)}
            alt={`preview-${idx}`}
            className="w-20 h-20 object-cover rounded-[10px] border"
          />
        ))}
      </div>

      {errorMessage && (
        <p className="text-red-800 bg-red-100 border border-red-300 rounded-md p-4 text-center mb-6 whitespace-pre-wrap">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 text-lg font-semibold text-white bg-blue-600 rounded-md cursor-pointer transition-colors mt-4 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? loadingButtonText : submitButtonText}
      </button>

    </form>
  )
}