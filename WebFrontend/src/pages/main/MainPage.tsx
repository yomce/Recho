// src/pages/MainPage.tsx (수정 완료)
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore"; // Zustand 스토어 import
import { jwtDecode, type JwtPayload } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  // 스토어에서 user 정보와 logout 함수를 가져옵니다.
  const { user, logout } = useAuthStore();

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = async () => {
    await logout(); // 스토어의 통합 로그아웃 함수 호출
    alert("로그아웃 되었습니다.");
    navigate("/"); // 로그아웃 후 메인 페이지로 리프레시
  };

  const accessToken = localStorage.getItem("accessToken");
  /**
   * 페이지 이동 함수들
   */
  const handleGoToLogin = () => navigate("/login");
  const handleGoToChat = () => navigate("/chat");
  const handleGoToUsedProducts = () => navigate("/used-products");
  const handleGoToEnsemble = () => navigate("/ensembles");
  const handleCreateVideo = () => {
    // RN의 비디오 편집 컴포넌트로 전환
    const message = {
      // RN에게 넘길 정보
      type: "CREATE_VIDEO",
      token: accessToken,
    };
    // React Native WebView 환경인지 확인, postMessage를 호출
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      console.log("Sent message to React Native: CREATE_VIDEO");
    } else {
      // 웹 브라우저 환경일 때의 대체 동작
      // 나중에 버튼을 없애는 쪽으로 바꾸는 게 좋을 듯??
      alert("비디오 생성은 앱에서만 가능합니다.");
    }
  };

  const handleGoToMyPage = () => {
    // localStorage에서 토큰을 가져와 id를 추출
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        const id = decodedToken.id;
        navigate(`/users/${id}`);
      } catch (error) {
        console.error("마이페이지 이동 실패: 유효하지 않은 토큰입니다.", error);
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
    } else {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  };

  // 공통 버튼 스타일
  const buttonBaseStyle =
    "py-2 px-5 text-lg font-semibold text-white rounded-md cursor-pointer transition-colors";

  return (
    <div className="p-5">
      {/* --- 1. user 객체 유무에 따라 다른 UI 렌더링 --- */}
      {user ? (
        // --- 로그인 상태일 때의 UI ---
        <div>
          <h1 className="text-3xl font-bold">{user.username}님, 환영합니다!</h1>
          <p className="text-lg mt-2">무엇을 도와드릴까요?</p>

          <div className="mt-5 flex gap-3 flex-col">
            <button
              onClick={handleGoToChat}
              className={`${buttonBaseStyle} bg-blue-500 hover:bg-blue-600`}
            >
              채팅하기
            </button>
            <button
              onClick={handleGoToUsedProducts}
              className={`${buttonBaseStyle} bg-green-600 hover:bg-green-700`}
            >
              중고거래하기
            </button>
            <button
              onClick={handleGoToEnsemble}
              className={`${buttonBaseStyle} bg-yellow-600 hover:bg-yellow-700`}
            >
              합주인원 모집하기
            </button>
            <button
              onClick={handleLogout}
              className={`${buttonBaseStyle} bg-red-600 hover:bg-red-700`}
            >
              로그아웃
            </button>
            <button
              onClick={handleGoToMyPage}
              className={`${buttonBaseStyle} bg-gray-600`}
            >
              마이페이지
            </button>
            <button
              onClick={handleCreateVideo}
              className={`${buttonBaseStyle} bg-brand-primary`}
            >
              비디오 생성
            </button>
          </div>
        </div>
      ) : (
        // --- 로그아웃 상태일 때의 UI ---
        <div>
          <h1 className="text-3xl font-bold">
            메인 페이지에 오신 것을 환영합니다!
          </h1>
          <p className="text-lg mt-2">로그인하고 모든 기능을 이용해보세요.</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleGoToUsedProducts}
              className={`${buttonBaseStyle} bg-green-600 hover:bg-green-700`}
            >
              중고거래하기
            </button>
            <button
              onClick={handleGoToLogin}
              className={`${buttonBaseStyle} bg-blue-500 hover:bg-blue-600`}
            >
              로그인하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
