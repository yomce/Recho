// src/components/atoms/button/IconButton.tsx
import React from 'react';
import Icon from '../icon/Icon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isIt?: boolean
  iconName: React.ComponentProps<typeof Icon>['name'];
  iconSecondName? : React.ComponentProps<typeof Icon>['name'];
  iconSecondColor? : string;
  iconSize?: number;
  as?: React.ElementType; // 'div', 'span' 등 다른 태그를 받을 수 있도록 as prop 추가
}

const IconButton: React.FC<IconButtonProps> = ({ 
  isIt = false,
  iconName,
  iconSecondName,
  iconSecondColor,
  iconSize, 
  className,
  as: Component = 'button', // as prop의 기본값을 'button'으로 설정
  ...props
}) => {
  const finalIconName = isIt && iconSecondName ? iconSecondName : iconName;
  const finalColor = isIt ? iconSecondColor : undefined; // isIt이 true일 때만 iconSecondColor 적용

  return (
    <Component
      {...props}
      className={`p-2 text-brand-gray transition-colors hover:text-brand-primary active:text-brand-primary disabled:opacity-50 ${className || ''}`}
    >
      <Icon name={finalIconName} size={iconSize} color={finalColor} />
    </Component>
  );
};

export default IconButton;