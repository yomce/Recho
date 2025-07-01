import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/main", label: "홈", icon: "🏠" },
    { path: "/vinyl", label: "비닐", icon: "💿" },
    { path: "/chat", label: "채팅", icon: "💬" },
    { path: "/used-products", label: "중고", icon: "🛍️" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 로그인/회원가입 페이지에서는 네비게이션 숨기기
  const shouldHideNavigation = () => {
    const hidePaths = ["/login", "/register"];
    return hidePaths.includes(location.pathname);
  };

  // 로그인/회원가입 페이지에서는 네비게이션을 렌더링하지 않음
  if (shouldHideNavigation()) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: isActive(item.path) ? "#007bff" : "#ffffff",
            color: isActive(item.path) ? "#ffffff" : "#333333",
            fontSize: "20px",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};

export default Navigation;
