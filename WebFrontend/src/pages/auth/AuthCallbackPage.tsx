import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore'; // Zustand 스토어 import

const AuthCallbackPage: React.FC = () => {
  // URL의 쿼리 파라미터(?token=...)를 읽기 위한 훅
  const [searchParams] = useSearchParams();
  // 페이지 이동을 위한 훅
  const navigate = useNavigate();
  // Zustand 스토어에서 setToken 함수를 가져옵니다.
  // (useAuthStore에 setToken 함수가 localStorage와 상태를 모두 업데이트한다고 가정)
  const { setToken } = useAuthStore.getState();

  useEffect(() => {
    // URL에서 'token' 파라미터를 추출합니다.
    const token = searchParams.get('token');
    
    if (token) {
      // 1. 추출한 토큰을 Zustand 스토어와 localStorage에 저장합니다.
      setToken(token);
      alert('로그인에 성공했습니다.');
      // 2. 모든 처리가 끝났으므로 메인 페이지로 이동시킵니다.
      navigate('/main');
    } else {
      // 토큰이 없는 비정상적인 접근일 경우 로그인 페이지로 보냅니다.
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login');
    }
    // 이 useEffect는 페이지가 처음 로드될 때 한 번만 실행되면 됩니다.
  }, [searchParams, navigate, setToken]);

  // 실제 화면에는 이 내용만 잠시 보입니다.
  return (
    <div className="flex items-center justify-center h-screen">
      <p>로그인 처리 중입니다. 잠시만 기다려주세요...</p>
    </div>
  );
};

export default AuthCallbackPage;