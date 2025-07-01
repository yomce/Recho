import React from 'react';

// PrimaryButton과 동일한 props 구조를 사용합니다.
interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="py-2 px-3 text-footnote 
      rounded-[var(--radius-button)] bg-brand-gray text-white disabled:opacity-50 
      whitespace-nowrap
      cursor-pointer"
    >
      {children}
    </button>
  );
};

export default SecondaryButton;