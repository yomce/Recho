// src/pages/MainPage.tsx (수정 완료)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore"; // Zustand 스토어 import
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { toast } from "react-hot-toast";
import Modal from "@/components/molecules/modal/Modal";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import { Link } from "react-router-dom";

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 구조 변경에 따라 user 상태와 actions를 별도로 선택합니다.
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.actions.logout);

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = async () => {
    try {
      await logout();
      alert("로그아웃 되었습니다.");
      navigate("/"); // 로그아웃 후 메인 페이지로 리프레시
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
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
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "CREATE_VIDEO", token: accessToken })
      );
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
        console.error("마이페이지 이동 실패:", error);
        handleLogout();
      }
    } else {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSelectVideoFromGallery = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "CREATE_VIDEO_FROM_GALLERY",
        payload: { token: accessToken },
      })
    );
    toast.success("앱에서 갤러리를 확인해주세요!");
    closeModal();
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
              className={`${buttonBaseStyle} bg-orange-600`}
            >
              RN컴포넌트 테스트
            </button>
            <button
              onClick={openModal}
              className={`${buttonBaseStyle} bg-purple-600 hover:bg-purple-700`}
            >
              진짜 비디오 생성 테스트
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="새로운 Vinyl 만들기"
      >
        <div className="flex flex-col gap-3 mt-4">
          <p className="text-body text-brand-text-secondary mb-2">
            새로운 비디오를 만들기 위한 소스를 선택해주세요.
          </p>
          <PrimaryButton onClick={handleSelectVideoFromGallery}>
            갤러리에서 선택
          </PrimaryButton>
          <PrimaryButton
            onClick={() => alert("촬영하기 기능은 준비 중입니다.")}
          >
            촬영하기
          </PrimaryButton>
          <SecondaryButton onClick={closeModal}>닫기</SecondaryButton>
        </div>
      </Modal>
    </div>
  );
};

export default MainPage;
