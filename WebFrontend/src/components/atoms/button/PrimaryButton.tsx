import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, ...props }) => (
  <button className=" w-full bg-brand-primary text-white py-2 px-4 rounded-button text-button" {...props}>
    {children}
  </button>
);

// 아래와 같이 PrimaryButton을 export 하여, 
// <button type="submit" className="w-full bg-brand-primary text-white py-2 px-4 rounded-button text-button"> 
// 이 버튼을 대체해서 사용할 수 있습니다.
export default PrimaryButton;