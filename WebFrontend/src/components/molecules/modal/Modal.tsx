import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // 모달의 내용을 유연하게 받기 위함
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // 배경 (Backdrop)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 모달 컨테이너 */}
      <div
        className="relative w-full max-w-sm p-6 bg-brand-default rounded-[var(--radius-card)] shadow-lg"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 전파 방지
      >
        {/* 타이틀 */}
        <h3 className="text-subheadline text-brand-text-primary mb-4">
          {title}
        </h3>

        {/* 내용 (자식 요소들이 여기에 렌더링됨) */}
        <div className="text-body text-brand-text-secondary">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
 