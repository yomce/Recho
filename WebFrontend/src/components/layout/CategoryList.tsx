import React from "react";
import { PRODUCT_CATEGORY_LABELS } from "@/types/product";

interface CategoryListProps {
  categories?: string[];
  onClickCategory?: (category: string) => void;
  selectedCategory?: string;
}

const productCategories = ["전체", ...Object.values(PRODUCT_CATEGORY_LABELS)];

const CategoryList: React.FC<CategoryListProps> = ({
  categories = productCategories,
  onClickCategory,
  selectedCategory,
}) => {
  const categoryImages: Record<string, string> = {
    전체: 'https://recho-img.s3.ap-northeast-2.amazonaws.com/default-img/all.jpg',
    일렉기타: 'https://recho-img.s3.ap-northeast-2.amazonaws.com/default-img/electric.png',
    베이스기타: 'https://recho-img.s3.ap-northeast-2.amazonaws.com/default-img/base.png', // public 폴더에 파일을 두고 이렇게 경로 지정
    통기타: 'https://recho-img.s3.ap-northeast-2.amazonaws.com/default-img/acoustic.png',
    클래식기타: 'https://recho-img.s3.ap-northeast-2.amazonaws.com/default-img/classical.png',
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
            <div className="w-[64px] h-[64px]">
              <img
                src={categoryImages[category] || 'https://placehold.co/64x64?text=기타'}
                alt={category}
                className={`w-full h-full object-cover bg-white rounded-full transition-all duration-100 ease-in-out ${
                  selectedCategory === category
                    ? "ring-1 ring-brand-primary"
                    : "bg-white opacity-80"
                }`}
              />
            </div>
            <span className="mt-1 text-[14px] text-black">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
};

export default CategoryList;