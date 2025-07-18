import React from 'react';

type TextAreaInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const textareaStyles =
  "w-full text-left py-3 px-4 bg-brand-inverse rounded-card box-border text-footnote placeholder:text-gray-400 border border-gray-300 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] resize-y min-h-[150px] whitespace-pre-wrap";

const TextAreaInput: React.FC<TextAreaInputProps> = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`${textareaStyles} ${className}`}
  />
);

export default TextAreaInput;