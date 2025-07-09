// src/pages/main/MainPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUiStore } from '@/stores/uiStore';

// Zustand 스토어 및 아토믹 컴포넌트 import
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/layout/MainLayout';
import Icon from '@/components/atoms/icon/Icon';
import Modal from '@/components/molecules/modal/Modal';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';
import CategoryIcon from '@/components/organisms/CategoryIcon';
import PromotionCarousel from '@/components/organisms/PromotionCarousel';

// --- Helper Components ---
const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <div className="group flex cursor-pointer flex-col items-center gap-2" onClick={onClick}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-default">
          {icon}
      </div>
      <span className="text-caption font-medium text-brand-gray transition-colors group-hover:text-brand-primary">{label}</span>
  </div>
);

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useAuthStore((state) => state.user);
    const accessToken = localStorage.getItem('accessToken');
    const { isVinylCreateModalOpen, actions: { closeVinylCreateModal } } = useUiStore();
    // --- 페이지 컨텐츠에 필요한 핸들러들만 남깁니다 ---
    const handleGoToUsedProducts = () => navigate('/used-products');
    const handleGoToEnsemble = () => navigate('/ensembles');
    const handleGoToPracticeRoom = () => navigate('/practice-room');
    const handleGoToPromotions = () => navigate('/promotions');

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleSelectVideoFromGallery = () => {
        if (!accessToken) {
            toast.error('로그인이 필요합니다.');
            return;
        }
        window.ReactNativeWebView?.postMessage(
            JSON.stringify({
                type: 'CREATE_VIDEO_FROM_GALLERY',
                payload: { token: accessToken },
            })
        );
        toast.success('앱에서 갤러리를 확인해주세요!');
        closeVinylCreateModal();
    };
    // 캐러셀에 표시할 임시 데이터
    const promotionData = [
      { id: 1, imageUrl: 'https://placehold.co/600x800/FFD700/000000?text=Let\'s+Rock', title: '렛츠락 페스티벌', subtitle: '2025.9.6 - 2025.9.7' },
      { id: 2, imageUrl: 'https://placehold.co/600x800/87CEEB/FFFFFF?text=Concert', title: 'yomce 단독 콘서트', subtitle: '서울, 대한민국' },
      { id: 3, imageUrl: 'https://placehold.co/600x800/32CD32/FFFFFF?text=Musical', title: '새로운 뮤지컬', subtitle: '2025.10.1 - 2025.12.31' },
    ];

    return (
        <Layout>
            <div className="p-4">
                <h1 className="text-subheadline text-left font-bold text-brand-text-primary">
                    {user?.username}님, 환영합니다!
                </h1>
            </div>
            
            <div className="mx-4 mt-2 rounded-card bg-brand-default p-4">
                <PromotionCarousel items={promotionData} />
            </div>

            <CategoryIcon>
                <QuickAction 
                    icon={<Icon name="camera" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="바이닐제작" 
                    onClick={openModal} 
                />
                <QuickAction 
                    icon={<Icon name="store" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="악기거래" 
                    onClick={handleGoToUsedProducts} 
                />
                <QuickAction 
                    icon={<Icon name="music" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="세션모집" 
                    onClick={handleGoToEnsemble} 
                />
                <QuickAction 
                    icon={<Icon name="calendar" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="합주실 예약" 
                    onClick={handleGoToPracticeRoom} 
                />
                <QuickAction 
                    icon={<Icon name="megaphone" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="공연홍보" 
                    onClick={handleGoToPromotions} 
                />
            </CategoryIcon> 

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
                        onClick={() => toast('📹 촬영하기 기능은 앱에서 실행해 주세요.')}
                    >
                        촬영하기
                    </PrimaryButton>
                    <SecondaryButton onClick={closeVinylCreateModal}>닫기</SecondaryButton>
                </div>
            </Modal>
        </Layout>
    );
};

export default MainPage;