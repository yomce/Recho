// src/pages/main/CategoryPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Layout from '@/components/layout/MainLayout';
import CategoryIcon from '@/components/organisms/CategoryIcon';
import Icon from '@/components/atoms/icon/Icon';
import Modal from '@/components/molecules/modal/Modal';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <div className="group flex cursor-pointer flex-col items-center gap-2" onClick={onClick}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-default">
            {icon}
        </div>
        <span className="text-caption font-medium text-brand-gray transition-colors group-hover:text-brand-primary">{label}</span>
    </div>
);
const CategoryPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleGoToUsedProducts = () => navigate('/used-products');
    const handleGoToEnsemble = () => navigate('/ensembles');
    const handleGoToPracticeRoom = () => navigate('/practice-room');
    const handleGoToPromotions = () => navigate('/promotions');
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const handleSelectVideoFromGallery = () => {
        toast.success('앱에서 갤러리를 확인해주세요!');
        closeModal();
    };
    return (
        <Layout currentPath={location.pathname}>
            <CategoryIcon>
                <QuickAction 
                    icon={<Icon name="vinyl" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="바이닐" 
                    onClick={() => navigate('/vinyl')} 
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
                <QuickAction 
                    icon={<Icon name="camera" size={28} className="text-gray-600 transition-colors group-hover:text-brand-primary" />} 
                    label="바이닐 제작" 
                    onClick={openModal} 
                />
            </CategoryIcon>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="새로운 Vinyl 만들기">
                <div className="mt-4 flex flex-col gap-3">
                    <p className="text-body text-brand-text-secondary mb-2">새로운 비디오를 만들기 위한 소스를 선택해주세요.</p>
                    <PrimaryButton onClick={handleSelectVideoFromGallery}>갤러리에서 선택</PrimaryButton>
                    <PrimaryButton onClick={() => toast('📹 촬영하기 기능은 앱에서 실행해 주세요.')}>촬영하기</PrimaryButton>
                    <SecondaryButton onClick={closeModal}>닫기</SecondaryButton>
                </div>
            </Modal>

        </Layout>
    );
};

export default CategoryPage;