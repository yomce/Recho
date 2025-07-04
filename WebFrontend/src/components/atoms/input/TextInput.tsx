//src/components/atoms/input/TextInput.tsx

import React from 'react';

// 모든 표준 input 속성과 함께, 선택적으로 아이콘을 받을 수 있도록 props 정의
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({ icon, ...props }) => {
  // 아이콘이 있는지 여부를 확인
  const hasIcon = Boolean(icon);

  return (
    // 아이콘의 절대 위치를 위해 relative 컨테이너 사용
    <div className="relative w-full">
      {/* 아이콘이 props로 전달된 경우에만 렌더링 */}
      {hasIcon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <input
        {...props}
        // 아이콘 유무에 따라 왼쪽 패딩(pl-10)을 동적으로 추가
        className={`block w-full appearance-none rounded-[var(--radius-card)] 
          bg-brand-inverse border border-gray-300 px-3 py-3 text-footnote placeholder:text-gray-400 
          focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] 
          ${hasIcon ? 'pl-10' : ''}`}
      />
    </div>
  );
};

export default TextInput;