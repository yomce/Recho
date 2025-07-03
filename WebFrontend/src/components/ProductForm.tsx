// src/components/ProductForm.tsx (새로 생성)

import React from 'react';
import { TRADE_TYPE, type UsedProductForm } from '../types/product';
import LocationSearch from '@/components/map/LocationSearch';

// 목업 데이터도 props로 받도록 하여 컴포넌트의 재사용성을 높입니다.
const mockCategories = [
  { id: '1', name: '디지털기기' },
  { id: '2', name: '생활가전' },
  { id: '3', name: '가구/인테리어' },
  { id: '4', name: '의류' },
];
/*
const mockLocations = [
  { locationId: '1001', regionLevel1: '경기도', regionLevel2: '용인시' },
  { locationId: '1002', regionLevel1: '경기도', regionLevel2: '수원시' },
  { locationId: '2001', regionLevel1: '서울특별시', regionLevel2: '강남구' },
];
*/
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

// 공통 입력 필드 스타일
const inputStyles = "w-full py-3 px-4 text-base border border-gray-400 rounded-md box-border transition-all duration-200 text-gray-800 bg-gray-50 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/50";

export const ProductForm: React.FC<ProductFormProps> = ({
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
        <label htmlFor="title" className="block font-semibold mb-3 text-base text-gray-700">상품명</label>
        <input type="text" id="title" name="title" value={formState.title} onChange={onFormChange} required className={inputStyles} />
      </div>

      <div className="mb-6">
        <label htmlFor="categoryId" className="block font-semibold mb-3 text-base text-gray-700">카테고리</label>
        <select id="categoryId" name="categoryId" value={formState.categoryId} onChange={onFormChange} className={inputStyles}>
          {mockCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="price" className="block font-semibold mb-3 text-base text-gray-700">가격</label>
        <input type="number" id="price" name="price" value={formState.price} onChange={onFormChange} required placeholder="숫자만 입력" className={inputStyles} />
      </div>

      <div className="mb-6">
        <label htmlFor="tradeType" className="block font-semibold mb-3 text-base text-gray-700">거래 방식</label>
        <select id="tradeType" name="tradeType" value={formState.tradeType} onChange={onFormChange} className={inputStyles}>
          <option value={TRADE_TYPE.IN_PERSON}>직거래</option>
          <option value={TRADE_TYPE.DELIVERY}>택배거래</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="locationId" className="block font-semibold mb-3 text-base text-gray-700">지역</label>
        {/* 실제 위치 값을 반환하는 함수를 import 합니다 */}
        <LocationSearch />
      </div>

      <div className="mb-6">
        <label htmlFor="description" className="block font-semibold mb-3 text-base text-gray-700">상세 설명</label>
        <textarea id="description" name="description" value={formState.description} onChange={onFormChange} rows={6} required className={`${inputStyles} resize-y min-h-[150px]`} />
      </div>

      {errorMessage && (
        <p className="text-red-800 bg-red-100 border border-red-300 rounded-md p-4 text-center mb-6 whitespace-pre-wrap">
          {errorMessage}
        </p>
      )}

      <button type="submit" disabled={isLoading} className="w-full py-3 px-6 text-lg font-semibold text-white bg-blue-600 rounded-md cursor-pointer transition-colors mt-4 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70">
        {isLoading ? loadingButtonText : submitButtonText}
      </button>
    </form>
  );
};