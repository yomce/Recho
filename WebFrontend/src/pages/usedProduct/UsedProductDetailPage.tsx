import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { type UsedProduct, STATUS, TRADE_TYPE } from '../../types/product';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';

// CSS 파일을 import 하던 코드는 삭제합니다.

// Enum 값에 따른 한글 텍스트 매핑
const STATUS_TEXT = {
  [STATUS.FOR_SALE]: '판매중',
  [STATUS.IN_PROGRESS]: '예약중',
  [STATUS.SOLD]: '판매완료',
};

// Enum 값에 따른 Tailwind 클래스 매핑
const STATUS_CLASSES = {
  [STATUS.FOR_SALE]: 'bg-green-500 text-white',
  [STATUS.IN_PROGRESS]: 'bg-yellow-400 text-black',
  [STATUS.SOLD]: 'bg-gray-500 text-white',
};

const TRADE_TYPE_TEXT = {
  [TRADE_TYPE.IN_PERSON]: '직거래',
  [TRADE_TYPE.DELIVERY]: '택배거래',
};

const UsedProductDetailPage: React.FC = () => {
  const { user } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<UsedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = (product && user && product.userId === user.userId)

  useEffect(() => {
    if (!id) {
      setError('잘못된 상품 ID입니다.');
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<UsedProduct>(`used-products/${id}`);
        setProduct(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('상품을 찾을 수 없습니다.');
        } else {
          setError('상품 정보를 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const handleEdit = () => {
    if (!isOwner) {
      alert('상품 게시자가 아닙니다.');
      return;
    }
    navigate(`/used-products/edit/${id}`);
  }

  const handleDelete = async () => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      if (!isOwner) {
        alert('상품 게시자가 아닙니다.');
        return;
      }
      try {
        await axiosInstance.delete(`used-products/${id}`);
        alert('상품이 성공적으로 삭제되었습니다.');
        navigate('/used-products');
      } catch (err) {
        if (axios.isAxiosError(err)) { // err가 Axios 에러인지 확인하면 더 안전합니다.
          const messages = err.response?.data?.message;
          setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '상품 삭제 중 오류 발생');
        } else {
          setError('예상치 못한 오류가 발생했습니다.');
        }
      }
    }
  };
  
  // 로딩 및 에러 UI
  const renderStatusMessage = (message: string, isError: boolean = false) => (
    <div className="flex justify-center items-center h-screen">
      {isError ? (
        <p className="text-red-600 font-semibold">{message}</p>
      ) : (
        <div className="w-9 h-9 border-4 border-gray-200 border-l-blue-500 rounded-full animate-spin"></div>
      )}
    </div>
  );

  if (loading) return renderStatusMessage('로딩 중...');
  if (error) return renderStatusMessage(error, true);
  if (!product) return renderStatusMessage('상품 정보가 없습니다.', true);

  return (
    <div className="max-w-5xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg text-slate-800">
      <div className="flex flex-col md:flex-row md:gap-12">
        {/* 이미지 섹션 */}
        <div className="md:flex-1 md:max-w-md">
          <img
            src={product.imageUrl || 'https://placehold.co/600x400'}
            alt={product.title}
            className="w-full h-auto rounded-lg border border-gray-200"
          />
        </div>

        {/* 정보 섹션 */}
        <div className="mt-6 md:mt-0 md:flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>

          <div className="flex items-center gap-4 mb-4">
            <p className="text-2xl font-semibold text-gray-800 m-0">{product.price.toLocaleString()}원</p>
            <span className={`py-1 px-3 rounded-full text-xs font-semibold ${STATUS_CLASSES[product.status]}`}>
              {STATUS_TEXT[product.status]}
            </span>
          </div>

          <div className="my-4 text-base text-gray-600 leading-relaxed">
            <p className="my-2"><strong>판매자:</strong> {product.userId}</p>
            <p className="my-2"><strong>거래 방식:</strong> {TRADE_TYPE_TEXT[product.tradeType]}</p>
            {/* <p className="my-2"><strong>거래 지역:</strong> {product.location.regionLevel1} {product.location.regionLevel2}</p> */}
            <p className="my-2"><strong>거래 지역:</strong> {product.location?.address}</p>
            <p className="my-2"><strong>등록일:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold border-b-2 border-gray-100 pb-2 mb-4">상품 설명</h2>
            <pre className="whitespace-pre-wrap break-words text-base leading-relaxed text-gray-800 bg-gray-50 p-4 rounded">
              {product.description}
            </pre>
          </div>

          {/* 버튼 섹션 */}
          <div className="mt-auto pt-6 flex justify-between items-center border-t border-gray-200">
            <Link
              to="/used-products"
              className="py-3 px-6 border border-gray-400 rounded-md font-semibold bg-white text-gray-700 no-underline transition-all hover:bg-gray-50 hover:text-black"
            >
              목록으로
            </Link>
            
            {
              isOwner && <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="py-2 px-5 rounded-md font-semibold text-white bg-blue-500 cursor-pointer transition-colors hover:bg-blue-700"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="py-2 px-5 rounded-md font-semibold text-white bg-red-600 cursor-pointer transition-colors hover:bg-red-700"
              >
                삭제
              </button>
            </div>
            }
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsedProductDetailPage;