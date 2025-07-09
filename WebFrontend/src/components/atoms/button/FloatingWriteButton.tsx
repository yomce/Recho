import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";

const FloatingWriteButton = () => {
  const urlPath = useLocation()

  const basePath = urlPath.pathname.endsWith("/")
    ? urlPath.pathname.slice(0, -1)
    : urlPath.pathname;
  return (
    // <div className="fixed bottom-4 right-4">
    <div 
      className="fixed bottom-20 right-1/2 translate-x-1/2 z-20" 
      style={{maxWidth: 410, width: '100%'}}
    >
      <div className="flex justify-end pr-4">
        <Link
          to={`${basePath}/create`}
          className="w-[52px] h-[52px] bg-brand-primary text-white text-xl font-bold rounded-full flex items-center justify-center shadow-lg hover:bg-brand-hover transition"
        >
          <IoAddOutline size={28} />
        </Link>
      </div>
    </div>
  )
};

export default FloatingWriteButton;