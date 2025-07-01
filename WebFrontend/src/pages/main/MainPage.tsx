// src/pages/MainPage.tsx (수정 완료)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore'; // Zustand 스토어 import

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  // 스토어에서 user 정보와 logout 함수를 가져옵니다.
  const { user, logout } = useAuthStore();

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = async () => {
    await logout(); // 스토어의 통합 로그아웃 함수 호출
    alert('로그아웃 되었습니다.');
    navigate('/'); // 로그아웃 후 메인 페이지로 리프레시
  };

  /**
   * 페이지 이동 함수들
   */
  const handleGoToLogin = () => navigate('/login');
  const handleGoToChat = () => navigate('/chat');
  const handleGoToUsedProducts = () => navigate('/used-products');
  const handleGoToEnsemble = () => navigate('/ensembles');
  
  // 공통 버튼 스타일
  const buttonBaseStyle = "py-2 px-5 text-lg font-semibold text-white rounded-md cursor-pointer transition-colors";

  return (
    <div className="p-5">
      {/* --- 1. user 객체 유무에 따라 다른 UI 렌더링 --- */}
      {user ? (
        // --- 로그인 상태일 때의 UI ---
        <div>
          <h1 className="text-3xl font-bold">{user.username}님, 환영합니다!</h1>
          <p className="text-lg mt-2">무엇을 도와드릴까요?</p>
          
          <div className="mt-5 flex gap-3">
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
          </div>
        </div>
      ) : (
        // --- 로그아웃 상태일 때의 UI ---
        <div>
          <h1 className="text-3xl font-bold">메인 페이지에 오신 것을 환영합니다!</h1>
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