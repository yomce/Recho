import React from "react";
import Icon from "../icon/Icon";


interface FilterProps {
  label?: string;
  iconName?: React.ComponentProps<typeof Icon>['name'];
  selected?: boolean;
  onClick?: () => void;
  iconClassName?: string;
}

const FilterButton: React.FC<FilterProps> = ({
  label,
  iconName,
  selected = false,
  onClick,
  iconClassName,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center px-4 py-2 rounded-full text-caption
        ${selected ? "bg-gray-900 text-white" : "bg-white text-brand-gray"}
        border border-gray-300 min-w-[60px]
        hover:border-brand-primary transition
      `}
    >
      {iconName && (
        <Icon 
          name={iconName} 
          size={16} 
          className={`align-middle text-brand-gray ${iconClassName}`}
        />
      )}
      <span className="leading-none">{label}</span>
    </button>
  );
};

export default FilterButton;