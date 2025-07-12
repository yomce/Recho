// src/components/atoms/input/SelectInput.tsx
import React from 'react';
import Icon from '../icon/Icon'; // Icon 컴포넌트를 사용하여 화살표를 표시

// 다른 입력 컴포넌트와 스타일 일관성을 유지
const selectStyles = "w-full py-3 px-4 bg-brand-inverse rounded-card text-caption placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] appearance-none";

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
  className?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ options, className = '', ...props }) => (
  <div className="relative w-full">
    <select
      {...props}
      className={`${selectStyles} ${className}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <Icon name="arrowDown" size={16} className="text-brand-gray" />
    </div>
  </div>
);

export default SelectInput;