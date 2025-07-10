// src/pages/user/UsedProductDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { type UsedProduct, STATUS, TRADE_TYPE } from '../../types/product';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import useViewCounter from '@/hooks/useViewCounter';
import PostLayout from '@/components/layout/PostLayout';
import ImageCard from '@/components/atoms/card/ImageCard';
import UserProfileCard from '@/components/atoms/card/UserProfileCard';
import ProductInfoCard from '@/components/atoms/card/ProductInfoCard';
import MapPreviewCard from '@/components/atoms/card/MapViewCard';
import MessageInputForm from '@/components/atoms/input/MessageInput';
import IconButton from '@/components/atoms/button/IconButton';

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

  const isOwner = product && user && product.id === user.id;

  if(id) {
    useViewCounter({ type: 'used-products', id });
  }

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
  };

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
        if (axios.isAxiosError(err)) {
          const messages = err.response?.data?.message;
          setError(Array.isArray(messages) ? messages.join('\n') : messages || err.message || '상품 삭제 중 오류 발생');
        } else {
          setError('예상치 못한 오류가 발생했습니다.');
        }
      }
    }
  };

  /**
   * [신규] DM 보내기 버튼 클릭 시 실행되는 함수
   */
  const handleSendDm = async () => {
    if (!product) return; // 상품 정보가 없으면 실행하지 않음
    try {
      // 백엔드의 POST /chat/dm API를 호출합니다.
      const response = await axiosInstance.post("/chat/dm", {
        partnerId: product.id, // 판매자의 ID를 전송
      });

      const room = response.data;
      // 성공적으로 방이 생성/조회되면 해당 채팅방으로 이동합니다.
      navigate(`/chat/${room.id}`);
    } catch (err) {
      console.error("DM 채팅방 생성에 실패했습니다.", err);
      alert("DM을 시작할 수 없습니다.");
    }
  };

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
    <PostLayout bgClassName="bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col">
          {/* 이미지 섹션 */}
          <div className="md:flex-1 md:max-w-md my-8">
            <ImageCard
              src={product.imageUrl || 'https://placehold.co/400x300'}
              alt={product.title}
              width={600}
              height={400}
            />
          </div>

          <UserProfileCard
            imageUrl={product.imageUrl || 'https://placehold.co/40x40'}
            name={product.id}
            location={product.location.address}
            status="판매중"
          />
          {/* 정보 섹션 */}
          <div className="mt-6 md:mt-0 md:flex-1 flex flex-col">
            <ProductInfoCard
              title={product.title}
              price={product.price}
              tradeType={TRADE_TYPE_TEXT[product.tradeType]}
              createdAt={new Date(product.createdAt).toLocaleDateString()}
              description={product.description}
            />

            {product.location?.lat && product.location?.lng && (
              <MapPreviewCard
                lat={product.location.lat}
                lng={product.location.lng}
              />
            )}
          </div>
          {isOwner && (
            <div className="flex justify-end items-center gap-1">
              <IconButton iconName="edit" iconSize={20} onClick={handleEdit} />
              <IconButton iconName="delete" iconSize={20} onClick={handleDelete} />
            </div>
          )}
        </div>
      </div>
      <MessageInputForm
        onSubmit={(msg) => {
          console.log('보낼 메시지:', msg);
          // 여기서 서버로 전송하거나 상태 업데이트 가능
        }}
        onDmClick={handleSendDm}
      />
    </PostLayout>
  );
};

export default UsedProductDetailPage;