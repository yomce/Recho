import React from 'react';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const textareaStyles =
  "w-full py-3 px-4 bg-brand-inverse border border-gray-300 rounded-md box-border text-footnote placeholder:text-gray-400 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] resize-y min-h-[150px]";

const TextAreaInput: React.FC<TextAreaInputProps> = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`${textareaStyles} ${className}`}
  />
);

export default TextAreaInput;