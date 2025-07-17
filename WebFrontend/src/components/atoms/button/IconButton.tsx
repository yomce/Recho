// src/components/atoms/button/IconButton.tsx
import React from "react";
import Icon from "../icon/Icon";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isIt?: boolean;
  iconName: React.ComponentProps<typeof Icon>["name"];
  iconSecondName?: React.ComponentProps<typeof Icon>["name"];
  iconSecondColor?: string;
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
  as: Component = "button", // as prop의 기본값을 'button'으로 설정
  ...props
}) => {
  const finalIconName = isIt && iconSecondName ? iconSecondName : iconName;

  // color prop을 className으로 변환
  const finalColor = isIt ? iconSecondColor : undefined;

  // className에서 아이콘 관련 클래스 추출
  const iconClasses =
    className?.match(/(text-|!text-|stroke-|fill-)[^\s]*/g)?.join(" ") || "";
  const buttonClasses =
    className?.replace(/(text-|!text-|stroke-|fill-)[^\s]*/g, "").trim() || "";

  const iconClassName = finalColor || iconClasses;

  return (
    <Component
      {...props}
      className={`p-2 text-brand-gray transition-colors hover:text-brand-primary active:text-brand-primary disabled:opacity-50 ${buttonClasses}`}
    >
      <Icon name={finalIconName} size={iconSize} className={iconClassName} />
    </Component>
  );
};

export default IconButton;
