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
import { DeletePromotionForm } from '@/components/layout/DeletePromotionForm';

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
  const user = useAuthStore((state) => state.user);
  const accessToken = localStorage.getItem("accessToken");
  const {
    isVinylCreateModalOpen,
    actions: { closeVinylCreateModal },
  } = useUiStore();
  const [promotionData, setPromotionData] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalContent, setModalContent] = useState<'select' | 'add' | 'delete' | null>(null);

  const handleGoToUsedProducts = () => navigate("/used-products");
  const handleGoToEnsemble = () => navigate("/ensembles");
  const handleGoToPracticeRoom = () => navigate("/practice-room");
  const handleGoToPromotions = () => navigate("/promotions");

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

  const handleOpenActionModal = () => setModalContent('select');
  const handleCloseModal = () => setModalContent(null);

  const handleActionSuccess = () => {
    handleCloseModal();
    window.location.reload();
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
          <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-200"></div>
        ) : promotionData.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <p className="mt-2 font-medium text-gray-500">
              진행 중인 프로모션이 없습니다.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              새로운 공연 정보를 추가해보세요!
            </p>
          </div>
        ) : (
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
          onClick={() => useUiStore.getState().actions.openVinylCreateModal()}
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
        onClick={handleOpenActionModal} // ✅ 플로팅 버튼은 이제 '선택' 모달을 엽니다.
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-brand-primary p-2 text-white shadow-lg transition-all hover:scale-110"
        aria-label="새 작업"
      >
        <Icon name="plus" size={28} />
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
        isOpen={!!modalContent}
        onClose={handleCloseModal}
        title={modalContent === 'select' ? "작업 선택" : ""}
      >
        {(() => {
          switch (modalContent) {
            case 'select':
              return (
                <div className="flex flex-col gap-3">
                  <PrimaryButton onClick={() => setModalContent('add')}>
                    프로모션 추가
                  </PrimaryButton>
                  <PrimaryButton onClick={() => setModalContent('delete')} className="bg-brand-danger hover:bg-red-700">
                    프로모션 삭제
                  </PrimaryButton>
                  <SecondaryButton onClick={handleCloseModal} className="mt-2">
                    닫기
                  </SecondaryButton>
                </div>
              );
            case 'add':
              return <PromotionManualForm onSuccess={handleActionSuccess} />;
            case 'delete':
              return <DeletePromotionForm onSuccess={handleActionSuccess} />;
            default:
              return null;
          }
        })()}
      </Modal>
    </Layout>
  );
};

export default MainPage;