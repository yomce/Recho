// src/components/atoms/button/PrimaryButton.tsx

import React from 'react';

// 버튼이 받을 수 있는 모든 표준 HTML 버튼 속성(type, disabled, onClick 등)과
// 버튼 내부에 표시될 내용(children)을 위한 props 타입 정의
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props} // type, disabled, onClick 등 전달받은 모든 props를 적용
      className="flex w-full justify-center 
      rounded-[var(--radius-card)] 
      border border-transparent 
      bg-[var(--color-brand-primary)] 
      py-2 px-4 text-button text-[var(--color-brand-inverse)] 
      hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2 disabled:opacity-50
      cursor-pointer"
    >
      {children}
    </button>
  );
};

export default PrimaryButton;