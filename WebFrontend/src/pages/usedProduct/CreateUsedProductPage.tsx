import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TRADE_TYPE, type UsedProductForm, type CreateUsedProductPayload } from '../../types/product';
import { ProductForm } from '../../components/layout/pages/usedProduct/ProductForm';
import { useAuthStore } from '../../stores/authStore'; // Zustand 스토어 import
import axiosInstance from '@/services/axiosInstance';
import { useLocationStore } from '@/components/map/store/useLocationStore';
import { saveLocationToDB } from '@/components/map/LocationSaveHandler';

const CreateUsedProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // 스토어에서 user 정보 가져오기
  const [form, setForm] = useState<UsedProductForm>({
    title: '',
    description: '',
    price: '',
    categoryId: '1',
    tradeType: TRADE_TYPE.IN_PERSON,
    locationId: '',
  });

  const location = useLocationStore((state) => state.location);

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return
    }
    setForm(prev => ({
      ...prev,
      userId: user?.username as string,
    }))
  }, [user, navigate]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError('인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }
    if (!location) {
      setError('지역을 선택해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. locationId 먼저 저장
      const locationId = await saveLocationToDB(location);

      // 2. 게시글 저장
      const priceAsNumber = parseInt(form.price, 10);
      if (isNaN(priceAsNumber) || priceAsNumber < 0) throw new Error('가격은 0 이상의 숫자로 입력해야 합니다.');

      const payload: CreateUsedProductPayload = {
        title: form.title,
        description: form.description,
        price: priceAsNumber,
        categoryId: parseInt(form.categoryId, 10),
        tradeType: form.tradeType,
        locationId: String(locationId),
      };

      const response = await axiosInstance.post('used-products', payload);
      alert('상품이 성공적으로 등록되었습니다!');
      navigate(`/used-products/${response.data.productId}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const messages = err.response?.data?.message;
        setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '상품 등록 중 오류 발생');
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-10">로그인 페이지로 이동 중...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto my-8 p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-center mt-0 mb-8 text-2xl font-bold text-gray-800">중고 상품 등록</h2>
      <ProductForm
        formState={form}
        onFormChange={handleChange}
        onFormSubmit={handleSubmit}
        isLoading={loading}
        errorMessage={error}
        submitButtonText="상품 등록하기"
        loadingButtonText="등록 중..."
      />
    </div>
  );
};

export default CreateUsedProductPage;