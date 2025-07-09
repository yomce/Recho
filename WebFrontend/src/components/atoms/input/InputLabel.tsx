import React from "react";

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

const InputLabel: React.FC<LabelProps> = ({ children, className = "", htmlFor }) => {
  return (
    <label // span → label로 변경
      htmlFor={htmlFor}
      className={`block font-semibold mb-3 text-base text-left text-gray-700 ${className}`}
    >
      {children}
    </label>
  );
};

export default InputLabel;
