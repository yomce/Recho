// src/components/atoms/button/IconButton.tsx
import React from 'react';
import Icon from '../icon/Icon';

// 표준 버튼 속성 + 아이콘 관련 프롭들을 타입으로 정의
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: React.ComponentProps<typeof Icon>['name'];
  iconSize?: number;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  iconName, 
  iconSize, 
  className, // 외부에서 추가적인 스타일을 받을 수 있도록 className 프롭을 받음
  ...props      // onClick, disabled 등 나머지 모든 버튼 속성
}) => {
  return (
    <button
      {...props}
      // 기본 스타일과 외부에서 받은 스타일을 함께 적용
      className={`p-2 text-brand-gray transition-colors hover:text-brand-primary disabled:opacity-50 ${className || ''}`}
    >
      <Icon name={iconName} size={iconSize} />
    </button>
  );
};

export default IconButton;