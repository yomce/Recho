// src/pages/auth/AuthCallbackPage.tsx
import React, { useEffect, useRef } from "react"; // useRef를 import 합니다.
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.actions.setToken);
  
  // useEffect가 이미 실행되었는지 추적하기 위한 ref를 생성합니다.
  const hasRun = useRef(false);

  useEffect(() => {
    // 아직 실행된 적이 없을 때만 로직을 실행합니다.
    if (hasRun.current) {
      return;
    }
    // 실행되었다고 즉시 표시하여, 두 번째 실행을 방지합니다.
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setToken(token);
      alert("로그인에 성공했습니다!");
      // 사용자가 뒤로가기 버튼으로 콜백 페이지에 다시 오는 것을 방지합니다.
      navigate("/main", { replace: true });
    } else {
      alert("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      navigate("/login", { replace: true });
    }
  }, []); // 의존성 배열은 비워두는 것이 맞습니다.

  return (
    <div className="flex items-center justify-center h-screen">
      <p>로그인 처리 중입니다. 잠시만 기다려주세요...</p>
    </div>
  );
};

export default AuthCallbackPage;
