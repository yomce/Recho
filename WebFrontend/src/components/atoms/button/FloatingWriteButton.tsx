// src/components/atoms/button/FloatingWriteButton.tsx
import { Link, useLocation } from "react-router-dom";
import Icon from "../icon/Icon";

const FloatingWriteButton = () => {
  const urlPath = useLocation();

  const basePath = urlPath.pathname.endsWith("/")
    ? urlPath.pathname.slice(0, -1)
    : urlPath.pathname;
  return (
    // 바깥 div가 위치를 모두 담당합니다. (z-index, bottom, right 등)
    <div className="fixed bottom-25 right-4 z-20 sm:right-[calc(50vw-215px+16px)] rounded-full bg-brand-primary p-2 text-white shadow-lg transition-all hover:scale-110">
      <Link
        to={`${basePath}/create`}
        className="bg-brand-primary text-brand-inverse rounded-full flex items-center justify-center hover:scale-105 transition-all"
        aria-label="새 글 작성"
      >
        <Icon name="plus" size={28} className="!p-0 text-white !stroke-[3px]" />
      </Link>
    </div>
  );
};

export default FloatingWriteButton;
