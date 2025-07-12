// src/components/atoms/button/IconButton.tsx
import React from 'react';
import Icon from '../icon/Icon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: React.ComponentProps<typeof Icon>['name'];
  iconSize?: number;
  as?: React.ElementType; // 'div', 'span' 등 다른 태그를 받을 수 있도록 as prop 추가
}

const IconButton: React.FC<IconButtonProps> = ({ 
  iconName, 
  iconSize, 
  className,
  as: Component = 'button', // as prop의 기본값을 'button'으로 설정
  ...props
}) => {
  return (
    <Component // as prop으로 받은 컴포넌트(태그)를 렌더링
      {...props}
      className={`p-2 text-brand-gray transition-colors hover:text-brand-primary active:text-brand-primary disabled:opacity-50 ${className || ''}`}
    >
      <Icon name={iconName} size={iconSize} />
    </Component>
  );
};

export default IconButton;