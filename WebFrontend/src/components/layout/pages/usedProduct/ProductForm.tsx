// src/components/ProductForm.tsx (새로 생성)

import React from 'react';
import { useState } from 'react';
import { TRADE_TYPE, type UsedProductForm } from '../../../../types/product'
import LocationSelector from '../../../map/LocationSelector';
import InputLabel from '@/components/atoms/input/InputLabel';
import CategorySelector from '@/components/atoms/input/CategorySelector';
import TextInputForm from '@/components/atoms/input/TextInputForm';
import TextAreaInput from '@/components/atoms/input/TextAreaInput';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';


const productCategories = [
  { id: '1', name: '베이스기타' },
  { id: '2', name: '일렉기타' },
  { id: '3', name: '클래식기타' },
  { id: '4', name: '통기타' },
];

const tradeCategories = [
  { id: 'IN_PERSON', name: '직거래' },
  { id: 'DELIVERY', name: '택배거래' },
];

// 폼에 필요한 props 타입 정의
interface ProductFormProps {
  formState: UsedProductForm;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  errorMessage: string | null;
  submitButtonText: string;
  loadingButtonText: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  formState,
  onFormChange,
  onFormSubmit,
  isLoading,
  errorMessage,
  submitButtonText,
  loadingButtonText,
}) => {
  const [form1, setForm1] = useState({ categoryId: '' });
  const [form2, setForm2] = useState({ TRADE_TYPE: '' });
  
  return (
    <form onSubmit={onFormSubmit}>
      <div className="mb-6">
        <InputLabel htmlFor="title">상품명</InputLabel>
        <TextInputForm type="text" id="title" name="title" value={formState.title} onChange={onFormChange} required />
      </div>

      <div className="mb-6">
        <InputLabel htmlFor="categoryId">카테고리</InputLabel>
        <CategorySelector
          name="productCategories"
          value={String(form1.categoryId)}
          onChange={(e) => setForm1({ categoryId: e.target.value })}
          categories={productCategories}
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
          name="tradeCategories"
          value={String(form2.TRADE_TYPE)}
          onChange={(e) => setForm2({ TRADE_TYPE: e.target.value })}
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
  );
};