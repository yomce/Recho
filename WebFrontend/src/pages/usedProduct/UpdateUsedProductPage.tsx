// src/pages/UpdateUsedProductPage.tsx (수정)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { TRADE_TYPE, type UsedProductForm, type UsedProduct } from '../../types/product';
import { ProductForm } from '../../components/layout/pages/usedProduct/ProductForm'; // 재사용 폼 컴포넌트 import
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import { saveLocationToDB } from '@/components/map/LocationSaveHandler';

const UpdateUsedProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocationStore((state) => state.location);

  const [form, setForm] = useState<UsedProductForm>({
    title: '', description: '', price: '', categoryId: '',
    tradeType: TRADE_TYPE.IN_PERSON, locationId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return
    }
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<UsedProduct>(`used-products/${id}`);
        const product = response.data;
        setForm({
          title: product.title,
          description: product.description,
          price: String(product.price),
          categoryId: String(product.categoryId),
          tradeType: product.tradeType,
          locationId: String(product.location.locationId),
        });
      } catch (err) {
        if (axios.isAxiosError(err)) { // err가 Axios 에러인지 확인하면 더 안전합니다.
          const messages = err.response?.data?.message;
          setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '상품 등록 중 오류 발생');
        } else {
          setError('예상치 못한 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!location) {
      setError('지역을 선택해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // 1. locationId 먼저 저장
      const locationId = await saveLocationToDB(location);

      // 2. 게시글 수정 요청
      const priceAsNumber = parseInt(form.price, 10);
      if (isNaN(priceAsNumber) || priceAsNumber < 0) throw new Error('가격은 0 이상의 숫자로 입력해야 합니다.');

      const payload = {
        ...form,
        price: priceAsNumber,
        categoryId: parseInt(form.categoryId, 10),
        locationId: locationId,
      };
      await axiosInstance.patch(`used-products/${id}`, payload);
      alert('상품이 성공적으로 수정되었습니다!');
      navigate(`/used-products/${id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) { // err가 Axios 에러인지 확인하면 더 안전합니다.
        const messages = err.response?.data?.message;
        setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '상품 등록 중 오류 발생');
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">중고 상품 수정</h2>
      <ProductForm
        formState={form}
        onFormChange={handleChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="수정 완료"
        loadingButtonText="수정 중..."
      />
    </div>
  );
};

export default UpdateUsedProductPage;