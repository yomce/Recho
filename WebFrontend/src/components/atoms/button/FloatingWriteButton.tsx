// src/components/atoms/button/FloatingWriteButton.tsx
import { Link, useLocation } from "react-router-dom";
import IconButton from "./IconButton";

const FloatingWriteButton = () => {
  const urlPath = useLocation()

  const basePath = urlPath.pathname.endsWith("/")
    ? urlPath.pathname.slice(0, -1)
    : urlPath.pathname;
    return (
      // 바깥 div가 위치를 모두 담당합니다. (z-index, bottom, right 등)
      <div className="fixed bottom-20 right-4 z-20 sm:right-[calc(50vw-215px+16px)]">
        <Link
          to={`${basePath}/create`}
          className="w-14 h-14 bg-brand-primary text-brand-inverse rounded-full flex items-center justify-center hover:scale-105 transition-all"
          aria-label="새 글 작성"
        >
          <IconButton iconName="plus" iconSize={32} className="!p-0 !text-white" />
        </Link>
      </div>
    );
};

export default FloatingWriteButton;