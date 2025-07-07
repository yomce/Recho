import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore"; // Zustand 스토어 import

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  // `setToken` 함수를 `actions` 객체에서 가져오도록 수정합니다.
  const setToken = useAuthStore((state) => state.actions.setToken);

  useEffect(() => {
    // URL에서 'token' 파라미터를 추출합니다.
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 토큰이 있으면 스토어에 저장하고 메인 페이지로 리디렉션합니다.
      // 이제 setToken이 localStorage 저장까지 처리합니다.
      setToken(token);
      alert("로그인에 성공했습니다!");
      navigate("/main");
    } else {
      // 토큰이 없는 비정상적인 접근일 경우 에러 메시지를 표시하고 로그인 페이지로 보냅니다.
      alert("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      navigate("/login");
    }
  }, [navigate, setToken]);

  // 실제 화면에는 이 내용만 잠시 보입니다.
  return (
    <div className="flex items-center justify-center h-screen">
      <p>로그인 처리 중입니다. 잠시만 기다려주세요...</p>
    </div>
  );
};

export default AuthCallbackPage;
