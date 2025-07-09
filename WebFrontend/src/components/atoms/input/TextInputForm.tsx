import React from 'react';

interface TextInputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const inputStyles = "w-full py-3 px-4 bg-brand-inverse border border-gray-300 rounded-md box-border text-caption placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]";

const TextInputForm: React.FC<TextInputFormProps> = ({ icon, className = '', ...props }) => {
  const hasIcon = Boolean(icon);

  return (
    <div className="relative w-full">
      {hasIcon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`${inputStyles} ${hasIcon ? 'pl-10' : ''} ${className}`}
      />
    </div>
  );
};

export default TextInputForm;