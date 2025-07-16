// src/pages/main/MainPage.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useUiStore } from "@/stores/uiStore";
import { useLocation, useNavigate } from "react-router-dom";

// Zustand 스토어 및 아토믹 컴포넌트 import
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/layout/MainLayout";
import Icon from "@/components/atoms/icon/Icon";
import Modal from "@/components/molecules/modal/Modal";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import CategoryIcon from "@/components/organisms/CategoryIcon";
import PromotionCarousel from "@/components/organisms/PromotionCarousel";
import { fetchPromotions } from '@/api';
import type { Promotion } from '@/types/promotion';
import { PromotionManualForm } from '@/components/layout/PromotionMaunalForm';

// --- Helper Components ---
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <div
    className="group flex cursor-pointer flex-col items-center gap-2"
    onClick={onClick}
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-default">
      {icon}
    </div>
    <span className="text-caption font-medium text-brand-gray transition-colors group-hover:text-brand-primary">
      {label}
    </span>
  </div>
);

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setIsModalOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const accessToken = localStorage.getItem("accessToken");
  const {
    isVinylCreateModalOpen,
    actions: { closeVinylCreateModal },
  } = useUiStore();
  const [promotionData, setPromotionData] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  // --- 페이지 컨텐츠에 필요한 핸들러들만 남깁니다 ---
  const handleGoToUsedProducts = () => navigate("/used-products");
  const handleGoToEnsemble = () => navigate("/ensembles");
  const handleGoToPracticeRoom = () => navigate("/practice-room");
  const handleGoToPromotions = () => navigate("/promotions");

  const openModal = () => setIsModalOpen(true);
  // const closeModal = () => setIsModalOpen(false);

  const handleSelectVideoFromGallery = () => {
    if (!accessToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "CREATE_VIDEO_FROM_GALLERY",
        payload: { token: accessToken },
      })
    );
    toast.success("앱에서 갤러리를 확인해주세요!");
    closeVinylCreateModal();
  };

  const handleOpenPromotionModal = () => setIsPromotionModalOpen(true);
  const handleClosePromotionModal = () => setIsPromotionModalOpen(false);

  const handlePromotionAdded = () => {
    handleClosePromotionModal(); // 모달 닫기
    window.location.reload();   // 페이지 새로고침
  };

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const data = await fetchPromotions();
        setPromotionData(data);
      } catch (error) {
        console.error(error);
        toast.error("프로모션 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPromotions();
  }, []);

  const handleSearchClick = () => navigate("/search");
  const handleCategoryClick = () => navigate("/category");

  return (
    <Layout
      currentPath={location.pathname}
      onSearchClick={handleSearchClick}
      onCategoryClick={handleCategoryClick}
    >
      <div className="p-4">
        <h1 className="text-subheadline text-left font-bold text-brand-text-primary">
          {user?.username}님, 환영합니다!
        </h1>
      </div>

      <div className="mx-4 mt-2 rounded-card bg-brand-default p-4">
        {isLoading ? (
          // 1. 로딩 중일 때 표시할 스켈레톤
          <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-200"></div>
        ) : promotionData.length === 0 ? (
          // 2. 로딩 후 데이터가 없을 때 표시할 플레이스홀더
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            {/* Icon 컴포넌트가 있다면 활용하여 시각적 효과를 줄 수 있습니다. */}
            {/* <Icon name="megaphone" size={40} className="text-gray-400" /> */}
            <p className="mt-2 font-medium text-gray-500">
              진행 중인 프로모션이 없습니다.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              새로운 공연 정보를 추가해보세요!
            </p>
          </div>
        ) : (
          // 3. 데이터가 있을 때 실제 캐러셀 표시
          <PromotionCarousel items={promotionData} />
        )}
      </div>

      <CategoryIcon>
        <QuickAction
          icon={
            <Icon
              name="camera"
              size={28}
              className="text-gray-600 transition-colors group-hover:text-brand-primary"
            />
          }
          label="바이닐제작"
          onClick={openModal}
        />
        <QuickAction
          icon={
            <Icon
              name="store"
              size={28}
              className="text-gray-600 transition-colors group-hover:text-brand-primary"
            />
          }
          label="악기거래"
          onClick={handleGoToUsedProducts}
        />
        <QuickAction
          icon={
            <Icon
              name="music"
              size={28}
              className="text-gray-600 transition-colors group-hover:text-brand-primary"
            />
          }
          label="세션모집"
          onClick={handleGoToEnsemble}
        />
        <QuickAction
          icon={
            <Icon
              name="calendar"
              size={28}
              className="text-gray-600 transition-colors group-hover:text-brand-primary"
            />
          }
          label="합주실 예약"
          onClick={handleGoToPracticeRoom}
        />
        <QuickAction
          icon={
            <Icon
              name="megaphone"
              size={28}
              className="text-gray-600 transition-colors group-hover:text-brand-primary"
            />
          }
          label="공연홍보"
          onClick={handleGoToPromotions}
        />
      </CategoryIcon>

      <button
        onClick={handleOpenPromotionModal}
        disabled={isSubmitting}
        className="fixed bottom-5 right-5 z-50 h-10 w-10 rounded-full bg-gray-700 p-2 text-white opacity-40 shadow-lg transition-all hover:opacity-100 hover:scale-110 disabled:cursor-not-allowed disabled:bg-gray-400"
        aria-label="새 프로모션 추가"
      >
        {isSubmitting ? (
          // 로딩 중일 때 스피너 아이콘 (예시)
          <div className="h-full w-full animate-spin rounded-full border-2 border-t-transparent"></div>
        ) : (
          // 평상시 아이콘
          <Icon name="plus" size={24} />
        )}
      </button>

      <Modal
        isOpen={isVinylCreateModalOpen}
        onClose={closeVinylCreateModal}
        title="새로운 Vinyl 만들기"
      >
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-body text-brand-text-secondary mb-2">
            새로운 비디오를 만들기 위한 소스를 선택해주세요.
          </p>
          <PrimaryButton onClick={handleSelectVideoFromGallery}>
            갤러리에서 선택
          </PrimaryButton>
          <PrimaryButton
            onClick={() => toast("📹 촬영하기 기능은 앱에서 실행해 주세요.")}
          >
            촬영하기
          </PrimaryButton>
          <SecondaryButton onClick={closeVinylCreateModal}>
            닫기
          </SecondaryButton>
        </div>
      </Modal>

      <Modal
        isOpen={isPromotionModalOpen}
        onClose={handleClosePromotionModal}
        title="" // 폼 자체에 제목이 있으므로 모달 제목은 비워둡니다.
      >
        <PromotionManualForm onSuccess={handlePromotionAdded} />
      </Modal>
    </Layout>
  );
};

export default MainPage;
