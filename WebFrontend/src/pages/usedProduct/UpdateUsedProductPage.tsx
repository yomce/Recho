import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  TRADE_TYPE,
  type UsedProductForm,
  type UsedProduct,
} from '../../types/product';
// 👇 폼 스타일을 재사용합니다.
import './CreateUsedProductPage.css'; 

// --- Mock Data (등록 페이지와 동일) ---
const mockCategories = [
  { id: '1', name: '디지털기기' },
  { id: '2', name: '생활가전' },
  { id: '3', name: '가구/인테리어' },
  { id: '4', name: '의류' },
];

const mockLocations = [
  { locationId: '1001', regionLevel1: '경기도', regionLevel2: '용인시' },
  { locationId: '1002', regionLevel1: '경기도', regionLevel2: '수원시' },
  { locationId: '2001', regionLevel1: '서울특별시', regionLevel2: '강남구' },
];
// --- End of Mock Data ---


const UpdateUsedProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // URL에서 상품 ID 가져오기

  const [form, setForm] = useState<UsedProductForm>({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    tradeType: TRADE_TYPE.IN_PERSON,
    locationId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1. 기존 상품 데이터 불러오기 ---
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get<UsedProduct>(`http://localhost:3000/used-products/${id}`);
        const product = response.data;
        
        // 불러온 데이터로 폼 상태 설정
        setForm({
          title: product.title,
          description: product.description,
          price: String(product.price),
          categoryId: String(product.categoryId),
          tradeType: product.tradeType,
          locationId: product.location.locationId, // location 객체에서 ID 추출
        });

      } catch (err) {
        console.error('Failed to fetch product for update:', err);
        setError('상품 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]); // id가 변경될 때마다 데이터를 다시 불러옴

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- 2. handleSubmit을 PATCH 요청으로 수정 ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const priceAsNumber = parseInt(form.price, 10);
      if (isNaN(priceAsNumber) || priceAsNumber < 0) {
        throw new Error('가격은 0 이상의 숫자로 입력해야 합니다.');
      }

      // API로 보낼 데이터 (UpdateUsedProductDto와 형식을 맞춤)
      const payload = {
        title: form.title,
        description: form.description,
        price: priceAsNumber,
        categoryId: parseInt(form.categoryId, 10),
        tradeType: form.tradeType,
        locationId: form.locationId,
      };

      // POST 대신 PATCH 메서드 사용
      await axios.patch(
        `http://localhost:3000/used-products/${id}`,
        payload,
      );
      
      alert('상품이 성공적으로 수정되었습니다!');
      navigate(`/used-products/${id}`); // 수정된 상품의 상세 페이지로 이동

    } catch (err: any) {
      console.error('Failed to update used product:', err);
      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message;
        setError(messages);
      } else {
        setError(err.message || '상품 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 에러 발생 시 UI
  if (loading) return <div className="message-container"><div className="spinner"></div></div>;
  if (error) return <div className="message-container error-message">{error}</div>;

  return (
    <div className="form-container">
      {/* --- 3. 제목과 버튼 텍스트 수정 --- */}
      <h2>중고 상품 수정</h2>
      <form onSubmit={handleSubmit}>
        {/* ... (폼 그룹 JSX는 CreateUsedProductPage와 동일) ... */}
        <div className="form-group">
          <label htmlFor="title">상품명</label>
          <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        
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
          <select id="tradeType" name="tradeType" value={form.tradeType} onChange={handleChange}>
            <option value={TRADE_TYPE.IN_PERSON}>직거래</option>
            <option value={TRADE_TYPE.DELIVERY}>택배거래</option>
          </select>
        </div>
        
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
          {loading ? '수정 중...' : '수정 완료'}
        </button>
      </form>
    </div>
  );
}

export default UpdateUsedProductPage;