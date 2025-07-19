import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { toast } from "react-hot-toast";

const Navigation: React.FC = () => {
  return null;
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const openVinylCreateModal = useUiStore((state) => state.actions.openVinylCreateModal);

  const navItems = [
    { path: "/main", label: "홈", icon: "🏠" },
    { path: "/vinyl", label: "바이닐", icon: "💿" },
    { path: "/chat", label: "채팅", icon: "💬" },
    { path: "/used-products", label: "중고", icon: "🛍️" },
    { path: "/ensembles", label: "모집", icon: "🎸" },
    { path: "/style-guide", label: "스타일가이드", icon: "🎨" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 로그인/회원가입 페이지에서는 네비게이션 숨기기
  const shouldHideNavigation = () => {
    const hidePaths = ["/login", "/register"];
    return hidePaths.includes(location.pathname);
  };

  const handleCreateVideo = () => {
    // const accessToken = localStorage.getItem("accessToken");
    if (window.ReactNativeWebView) {
      // CREATE_VIDEO 메시지 전송 비활성화
      console.log("CREATE_VIDEO 메시지 전송 비활성화됨");
      // window.ReactNativeWebView.postMessage(
      //   JSON.stringify({ type: "CREATE_VIDEO", token: accessToken }),
      // );
    } else {
      toast.error("비디오 생성은 앱에서만 가능합니다.");
    }
    setIsOpen(false); // 메뉴 닫기
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
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <button
        key="toggle-menu"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#007bff",
          color: "#ffffff",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="메뉴"
      >
        {isOpen ? "✕" : "Nav"}
      </button>

      {isOpen && (
        <>
          <button
            key="back"
            onClick={() => {
              navigate(-1);
              setIsOpen(false);
            }}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#ffffff",
              color: "#333333",
              fontSize: "20px",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="뒤로가기"
          >
            {"⬅️"}
          </button>
          <button
            key="create-video-rn"
            onClick={handleCreateVideo}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#ff9800",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
            title="RN 컴포넌트 테스트"
          >
            RN
          </button>
          <button
            key="create-video-modal"
            onClick={() => {
              openVinylCreateModal();
              setIsOpen(false);
            }}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#9c27b0",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
            title="진짜 비디오 생성 테스트"
          >
            📹
          </button>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
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
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default Navigation;
