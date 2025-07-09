import React from "react";

export interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  categories: CategoryOption[];
  showSubCategory?: boolean;
}

const inputStyles = "w-full py-3 px-4 bg-brand-inverse border border-gray-300 rounded-md box-border text-caption placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]";


const CategorySelector: React.FC<CategoryProps> = ({
  value,
  onChange,
  categories,
  showSubCategory = true,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      {/* 대분류 */}
      <div className="flex-1">
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
      </div>

      {showSubCategory && (
        <>
          <span className="text-xl text-gray-700">›</span>
          {/* 중분류 */}
          <div className="flex-1">
            <select
              id="subCategory"
              name="subCategory"
              className={inputStyles}
              disabled
            >
              <option value="">선택</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default CategorySelector;