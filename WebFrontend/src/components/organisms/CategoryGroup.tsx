// src/components/organisms/CategoryGroup.tsx
import React from 'react';

interface CategoryGroupProps {
  title: string;
  children: React.ReactNode;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h2 className="mb-4 px-4 text-body font-semibold text-brand-text-primary">{title}</h2>
      <div className="mx-4 grid grid-cols-4 gap-4">{children}</div>
    </div>
  );
};

export default CategoryGroup;
