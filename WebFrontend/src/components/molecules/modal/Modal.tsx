import IconButton from '@/components/atoms/button/IconButton';
import type Icon from '@/components/atoms/icon/Icon';
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // 모달의 내용을 유연하게 받기 위함
  iconName?: React.ComponentProps<typeof Icon>['name'];
}

const Modal: React.FC<ModalProps> = ({ isOpen, iconName, onClose, title, children}) => {
  if (!isOpen) return null;

  return (
    // 배경 (Backdrop)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* 모달 컨테이너 */}
      <div
        className="relative w-full max-w-sm p-6 bg-brand-default rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 전파 방지
      >
        {iconName ? (
          <div className="flex items-center justify-between mb-4">
            {/* 아이콘의 공간을 확보하기 위한 빈 div */}
            <div className="w-6"></div> {/* 아이콘 크기에 맞게 너비 조정 (예: w-6) */}
            {/* 타이틀 (가운데 정렬) */}
            <h3 className="text-subheadline text-brand-text-primary">{title}</h3>
            <IconButton iconName={iconName} onClick={onClose} />
          </div>
        ) : (
          <h3 className="text-subheadline text-brand-text-primary mb-4">{title}</h3>
        )}

        {/* 내용 (자식 요소들이 여기에 렌더링됨) */}
        <div className="text-body text-brand-text-secondary">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
