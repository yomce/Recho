import React from 'react';

interface ProductInfoCardProps {
  title: string;
  price: number;
  tradeType: string;
  createdAt: string;
  description: string;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  title,
  price,
  tradeType,
  createdAt,
  description,
}) => {
  return (
    <div className="mt-6 flex flex-col gap-[4px]">
      <div className="flex items-start justify-between gap-[4px]">
        <h1 className="text-[24px] text-left font-bold">{title}</h1>
        <p className="mt-1 text-[20px] font-semibold text-gray-800 whitespace-nowrap">
          {price.toLocaleString()}원
        </p>
      </div>

      <div className="flex items-center">
        <div className="text-navigation text-brand-gray mt-[4px]">
          <div className="flex my-4">
            <span className="font-semibold">거래 방식:</span>
            <span>{tradeType}</span>
          </div>
          <div className="flex my-4">
            <span className="font-semibold">등록일:</span>
            <span>{createdAt}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <pre className="max-h-[300px] overflow-y-auto rounded bg-gray-50 p-4 text-[14px] leading-relaxed break-words whitespace-normal text-gray-800">
{description}
        </pre>
      </div>
    </div>
  );
};

export default ProductInfoCard;
