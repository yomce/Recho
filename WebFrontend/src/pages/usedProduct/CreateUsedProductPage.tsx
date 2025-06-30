import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// <<< 1. 새로운 타입들을 import합니다.
import {
  TRADE_TYPE,
  type UsedProductForm,
  type CreateUsedProductPayload,
  type Location,
} from '../../types/product';
import './CreateUsedProductPage.css';

// --- Mock Data ---
// 실제 앱에서는 이 데이터를 API로 불러오거나 상수로 관리합니다.
const mockCategories = [
  { id: '1', name: '디지털기기' },
  { id: '2', name: '생활가전' },
  { id: '3', name: '가구/인테리어' },
  { id: '4', name: '의류' },
];

const mockLocations: Location[] = [
  { locationId: '1001', regionLevel1: '경기도', regionLevel2: '용인시' },
  { locationId: '1002', regionLevel1: '경기도', regionLevel2: '수원시' },
  { locationId: '2001', regionLevel1: '서울특별시', regionLevel2: '강남구' },
];
// --- End of Mock Data ---


const CreateUsedProductPage: React.FC = () => {
  const navigate = useNavigate();

  // <<< 2. 단순화된 `UsedProductForm` 타입을 사용합니다.
  const [form, setForm] = useState<UsedProductForm>({
    title: '',
    description: '',
    price: '',
    categoryId: mockCategories[0].id, // 기본 카테고리 설정
    tradeType: TRADE_TYPE.IN_PERSON, // 문자열 enum 사용
    locationId: mockLocations[0].locationId, // location 객체 대신 ID만 관리
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // <<< 3. `handleChange` 로직이 매우 단순해졌습니다.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      // name 속성에 맞춰 동적으로 상태 업데이트
      [name]: value,
    }));
  };

  // <<< 4. `handleSubmit` 로직을 명확한 단계로 분리합니다.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 단계 1: 유효성 검사
      const priceAsNumber = parseInt(form.price, 10);
      if (isNaN(priceAsNumber) || priceAsNumber < 0) {
        throw new Error('가격은 0 이상의 숫자로 입력해야 합니다.');
      }

      // 단계 2: API 전송을 위한 데이터 변환 (Payload 생성)
      // UsedProductForm -> CreateUsedProductPayload 타입으로 변환
      const payload: CreateUsedProductPayload = {
        title: form.title,
        description: form.description,
        price: priceAsNumber,
        categoryId: parseInt(form.categoryId, 10),
        tradeType: form.tradeType,
        locationId: form.locationId,
      };

      // 단계 3: API 요청
      const response = await axios.post(
        'http://localhost:3000/used-products',
        payload, // 변환된 payload 전송
      );
      
      const newProductId = response.data.productId;
      alert('상품이 성공적으로 등록되었습니다!');
      navigate(`/used-products/${newProductId}`);

    } catch (err: any) {
      console.error('Failed to create used product:', err);
      // 에러 메시지 처리는 기존 로직 유지 (개선됨)
      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message;
        setError(messages);
      } else {
        setError(err.message || '상품 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>중고 상품 등록</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">상품명</label>
          <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        
        {/* <<< 5. UI/UX 개선: 카테고리 선택 추가 */}
        <div className="form-group">
          <label htmlFor="categoryId">카테고리</label>
          <select id="categoryId" name="categoryId" value={form.categoryId} onChange={handleChange}>
            {mockCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">가격</label>
          <input type="number" id="price" name="price" value={form.price} onChange={handleChange} required placeholder="숫자만 입력" />
        </div>

        <div className="form-group">
          <label htmlFor="tradeType">거래 방식</label>
          {/* <<< 6. Enum 처리 변경: 문자열 enum 값 직접 사용 */}
          <select id="tradeType" name="tradeType" value={form.tradeType} onChange={handleChange}>
            <option value={TRADE_TYPE.IN_PERSON}>직거래</option>
            <option value={TRADE_TYPE.DELIVERY}>택배거래</option>
          </select>
        </div>
        
        {/* <<< 5. UI/UX 개선: 지역 선택을 드롭다운으로 변경 */}
        <div className="form-group">
          <label htmlFor="locationId">지역</label>
          <select id="locationId" name="locationId" value={form.locationId} onChange={handleChange}>
            {mockLocations.map(loc => (
              <option key={loc.locationId} value={loc.locationId}>
                {`${loc.regionLevel1} ${loc.regionLevel2}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">상세 설명</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={10} required />
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '등록 중...' : '상품 등록하기'}
        </button>
      </form>
    </div>
  );
}

export default CreateUsedProductPage;