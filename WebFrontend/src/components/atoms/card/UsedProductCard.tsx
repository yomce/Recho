import React from "react";
import { Link } from "react-router-dom";

interface UsedProductCardProps {
  productId: number;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  linkUrl?: string;
}

const UsedProductCard: React.FC<UsedProductCardProps> = ({
  productId,
  title,
  description = "",
  price,
  imageUrl = "",
  linkUrl = `/used-products/${productId}`,
}) => {
  return (
    <div className="w-full h-full">
      <Link to={linkUrl} className="block">
        <div className="flex items-start justify-between bg-white border border-gray-200 rounded-[var(--radius-card)] max-h-[120px]">
          <div className="flex flex-col min-w-0 p-4 mt-1 items-start">
            <h2 className="text-body font-semibold mb-1 line-clamp-1 text-gray-900">
              {title}
            </h2>
            <p className="text-footnote text-left text-gray-500 mb-2 line-clamp-1">
              {description}
            </p>
            <span className="text-[16px] font-bold mt-2 flex items-center gap-1">
              <span className="truncate max-w-[160px] inline-block">
                {price.toLocaleString()}
              </span>
              <span>원</span>
            </span>
          </div>
          <div className="max-w-[120px] max-h-[120px] flex-shrink-0 rounded-r-[20px] overflow-hidden bg-gray-200">
            <img 
              src={imageUrl || 'https://placehold.co/120x120'} 
              alt="상품 썸네일"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </Link>
    </div>
  )
}
export default UsedProductCard;