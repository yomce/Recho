// src/components/ProductForm.tsx (새로 생성)

import React from 'react';
import { type UsedProductForm } from '../../../../types/product'
import LocationSelector from '../../../map/LocationSelector';
import InputLabel from '@/components/atoms/input/InputLabel';
import CategorySelector from '@/components/atoms/input/CategorySelector';
import { PRODUCT_CATEGORY_LABELS } from '@/types/product';
import TextInputForm from '@/components/atoms/input/TextInputForm';
import TextAreaInput from '@/components/atoms/input/TextAreaInput';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import ImageUploadPreview from '@/components/atoms/input/ImageUploadPreveiw';
import MyVideoSelector from '@/components/atoms/input/MyVideoSelector';


const categoryLabels = Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, name]: [string, string]) => ({
  id: Number(key), // ProductCategory
  name,
}));

const tradeCategories = [
  { id: 'IN_PERSON', name: '직거래' },
  { id: 'DELIVERY', name: '택배거래' },
];

// 폼에 필요한 props 타입 정의
interface ProductFormProps {
  formState: UsedProductForm;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTradeTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  errorMessage: string | null;
  submitButtonText: string;
  loadingButtonText: string;
  setImageIds: React.Dispatch<React.SetStateAction<{ id: number; url: string }[]>>;   // 이미지 ID 배열을 관리하는 함수 (최초 생성 시 빈 배열로 시작)
  originalImages?: { id: number; url: string }[]; // 서버에서 받아온 기존 이미지
  onImageChange?: (images: { id: number; url: string }[]) => void; // 새로 추가된 이미지
  videoId?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  formState,
  onFormChange,
  onCategoryChange,
  onTradeTypeChange,
  onFormSubmit,
  isLoading,
  errorMessage,
  submitButtonText,
  loadingButtonText,
  setImageIds,
  originalImages = [],
  onImageChange,
}) => {
  return (
    <form onSubmit={onFormSubmit}>
      <div className="mb-6">
        <ImageUploadPreview 
          refIn="USED-PRODUCTS"
          onUploadComplete={(newIds) => {
            setImageIds((prev) => [...prev, ...newIds]);
          }}
          originalImages={originalImages}
          onImageChange={(updated) => {
            setImageIds(updated); // 이미지 삭제 시 imageIds도 갱신
            onImageChange?.(updated); // 상위 상태도 동기화
          }}
        />
      </div>
      <div className="mb-6">
        <InputLabel htmlFor="title">상품명</InputLabel>
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
        <InputLabel htmlFor="categoryId">카테고리</InputLabel>
        <CategorySelector
          name="productCategories"
          value={String(formState.categoryId)}
          onChange={onCategoryChange}
          categories={categoryLabels}
          showSubCategory={true}
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="price">가격</InputLabel>
        <TextInputForm 
          type="number" 
          id="price" 
          name="price" 
          min="0" 
          value={formState.price} 
          onChange={onFormChange} 
          required 
          placeholder="숫자만 입력" 
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="tradeType">거래 방식</InputLabel>
        <CategorySelector
          name="tradeType"
          value={String(formState.tradeType)}
          onChange={onTradeTypeChange}
          categories={tradeCategories}
          showSubCategory={false}
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="locationId">지역</InputLabel>
        <LocationSelector 
          locationId={formState.locationId}
        />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="description">상세 설명</InputLabel>
        <TextAreaInput id="description" name="description" value={formState.description} onChange={onFormChange} rows={6} required />
      </div>

      <div className="mb-6">
        <MyVideoSelector
          selectedId={formState.videoId}
          onSelect={(video) =>
            onFormChange({
              target: {
                name: 'videoId',
                value: video.id,
              },
            } as React.ChangeEvent<HTMLInputElement>) // 강제 캐스팅
          }
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
        style={{ borderRadius: "20px" }}
      >
        {isLoading ? loadingButtonText : submitButtonText}
      </PrimaryButton>
    </form>
  );
};