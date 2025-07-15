import React from "react";
import Icon from '@/components/atoms/icon/Icon';

interface CategoryProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  categories: { id: number | string; name: string }[];
  showSubCategory?: boolean;
}

const inputStyles = "w-full py-3 px-4 bg-brand-inverse border border-gray-300 rounded-[var(--radius-card)] box-border text-caption placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] appearance-none";


const CategorySelector: React.FC<CategoryProps> = ({
  value,
  onChange,
  categories,
  showSubCategory = true,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      {/* 대분류 */}
      <div className="relative flex-1">
        <select
          id="categoryId"
          name="categoryId"
          value={value}
          onChange={onChange}
          className={inputStyles}
        >
          <option value="">선택</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {/* 기본 select 화살표를 숨기고, 커스텀 아이콘을 우측에 배치합니다 */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <Icon name="downArrow" className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {showSubCategory && (
        <>
          <span className="text-xl text-gray-700">›</span>
          {/* 중분류 */}
          <div className="relative flex-1">
            <select
              id="subCategory"
              name="subCategory"
              className={inputStyles}
              disabled
            >
              <option value="">선택</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <Icon name="downArrow" className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategorySelector;