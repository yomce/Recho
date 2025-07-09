import React from "react";

interface CategoryListProps {
  categories?: string[];
  onClickCategory?: (category: string) => void;
  selectedCategory?: string;
}

const defaultCategories = ['전체', '일렉', '베이스', '통기타', '클래식'];

const CategoryList: React.FC<CategoryListProps> = ({
  categories = defaultCategories,
  onClickCategory,
  selectedCategory,
}) => {
  const categoryImages: Record<string, string> = {
    전체: 'https://placehold.co/60x60?text=All',
    일렉: 'https://placehold.co/60x60?text=Electic',
    베이스: 'https://placehold.co/64x64?text=Base',
    통기타: 'https://placehold.co/64x64?text=Acoustic',
    클래식: 'https://placehold.co/64x64?text=Classic',
  };

  return (
    <div className="overflow-x-auto mt-4 mb-4">
      <div className="flex flex-row gap-[24px] w-max py-1 px-1">
        {categories.map((category) => (
          <div
            key={category}
            onClick={() => onClickCategory?.(category)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
          >
            <img
              src={categoryImages[category] || 'https://placehold.co/64x64?text=기타'}
              alt={category}
              className={`w-[64px] h-[64px] rounded-full transition-all duration-100 ease-in-out ${
                selectedCategory === category
                  ? "ring-1 ring-brand-primary"
                  : "bg-gray-200 opacity-80"
              }`}
            />
            <span className="mt-1 text-[14px] text-black">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
};

export default CategoryList;