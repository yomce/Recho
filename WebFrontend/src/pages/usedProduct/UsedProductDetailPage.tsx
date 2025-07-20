// src/pages/user/UsedProductDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import axios from 'axios';
import { type UsedProduct, TRADE_TYPE, STATUS, STATUS_TEXT } from '../../types/product';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/services/axiosInstance';
import useViewCounter from '@/hooks/useViewCounter';
import PostLayout from '@/components/layout/PostLayout';
import UserProfileCard from '@/components/atoms/card/UserProfileCard';
import ProductInfoCard from '@/components/atoms/card/ProductInfoCard';
import MapPreviewCard from '@/components/atoms/card/MapViewCard';
import MessageInputForm from '@/components/atoms/input/MessageInput';
import IconButton from '@/components/atoms/button/IconButton';
import SwiperImageCard from '@/components/atoms/card/SwipeImageCard';
import { ToastMenu } from '@/components/atoms/button/ToastMenu';
import { StatusToastMenu } from '@/components/atoms/button/StatusToastMenu';
import toast from 'react-hot-toast';
import VideoPreviewSection from '@/components/atoms/card/VideoPreviewCard';

const TRADE_TYPE_TEXT = {
  [TRADE_TYPE.IN_PERSON]: '직거래',
  [TRADE_TYPE.DELIVERY]: '택배거래',
};

const UsedProductDetailPage: React.FC = () => {
  const { totalUnreadCount } = useChatStore();
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
        console.log(response.data);
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

  const handleStatusChange = async (status: STATUS) => {
    if(!isOwner || !product) return;
    console.log("상태변경요청");
    try {
      const res = await axiosInstance.patch(`/used-products/${product.productId}/status`, {status});
      setProduct(res.data);
      toast.success(`게시글 상태가 ${STATUS_TEXT}로 변경되었습니다.`);
    } catch (err) {
      toast.error('상태 변경에 실패했습니다.');
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

  // toast unmount 시 close. DOM 에서 토스트가 내려가면 호출됩니다
  useEffect(() => {
    return () => {
      toast.dismiss("status-toast");
    };
  }, []);

  if (loading) return renderStatusMessage('로딩 중...');
  if (error) return renderStatusMessage(error, true);
  if (!product) return renderStatusMessage('상품 정보가 없습니다.', true);

  return (
    <PostLayout totalUnreadCount={totalUnreadCount} bgClassName="bg-white">
      <div className="mx-auto max-w-6xl px-4 mb-8">
        <div className="flex flex-col">
          {/* 이미지 섹션 */}
          <div className="relative">
            <SwiperImageCard
              images={
                Array.isArray(product.imageUrl)
                ? product.imageUrl
                : product.imageUrl
                  ? [product.imageUrl] // string인 경우 배열로 변환
                  : []
              }
              width={400}
              height={300}
              slideClassName="py-4"
              imgClassName='rounded-[var(--radius-card)]'
              showPagination={true}
              />
            {isOwner && (
              <div className="absolute top-5 right-2 z-10">
                <IconButton
                iconName="moreFill"
                onClick={() =>
                  ToastMenu({
                    onEdit: () => handleEdit?.(),
                    onDelete: () => handleDelete?.(),
                  })
                  }
                />
              </div>
            )}
          </div>
          <UserProfileCard
          imageUrl={product.imageUrl ?? ""}
          user={product.user}
          name={product.user.username}
          location={product.location.address}
          status={STATUS_TEXT[product.status] as "판매중" | "예약중" | "판매완료"}
          onClick={() => {
            console.log('UserProfileCard clicked', { isOwner, product });
            if(isOwner) {
            StatusToastMenu({
              onChangeStatus: handleStatusChange,
              currentStatus: product.status,
            })
            }
          }}
          />
          {/* 정보 섹션 */}
          <div className="mt-6 md:mt-0 md:flex-1 flex flex-col mb-32">
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

          {product && (
            <VideoPreviewSection
              refIn="used_products"
              refPostId={product.productId}
            />
          )}
        </div>
      </div>
      <MessageInputForm
        onSubmit={(msg) => {
          console.log('보낼 메시지:', msg);
          // 여기서 서버로 전송하거나 상태 업데이트 가능
        }}
        onDmClick={handleSendDm}
        msgPlaceholder={"안녕하세요! 구매 원합니다."}
      />
    </PostLayout>
  );
};

export default UsedProductDetailPage;