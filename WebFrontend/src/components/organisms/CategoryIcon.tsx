// src/components/organisms/CategoryIcon.tsx
import React from 'react';
import Icon from '../atoms/icon/Icon';

// QuickAction은 CategoryMenu에서만 사용되므로, 여기에 함께 정의하여 캡슐화합니다.
const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <div className="group flex cursor-pointer flex-col items-center gap-2" onClick={onClick}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-default">
            {icon}
        </div>
        <span className="text-caption font-medium text-brand-gray transition-colors group-hover:text-brand-primary">{label}</span>
    </div>
);

// CategoryMenu가 받을 클릭 핸들러들을 props로 정의합니다.
interface CategoryMenuProps {
    children: React.ReactNode;
  }

  const CategoryMenu: React.FC<CategoryMenuProps> = ({ children }) => {
    return (
    <div className="mx-4 my-6 grid grid-cols-5 gap-3">
      {children}
    </div>
  );
};

export default CategoryMenu;