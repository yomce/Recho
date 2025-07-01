// src/pages/MainPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // jwt-decode 라이브러리 import
import axiosInstance from '../../services/axiosInstance'; // API 클라이언트 import

// 토큰에 담겨있는 payload의 타입 정의
interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  // 컴포넌트가 처음 렌더링될 때 사용자 정보를 설정합니다.
  useEffect(() => {
    // localStorage에서 accessToken을 가져옵니다.
    const token = localStorage.getItem('accessToken');

    if (token) {
      try {
        // 토큰을 해독하여 payload를 추출합니다.
        const decodedToken = jwtDecode<JwtPayload>(token);
        // 해독된 payload에서 username을 가져와 state에 저장합니다.
        setUsername(decodedToken.username);
      } catch (error) {
        console.error('유효하지 않은 토큰입니다.', error);
        // 토큰이 유효하지 않으면 로그아웃 처리할 수도 있습니다.
        handleLogout();
      }
    }
  }, []); // 빈 배열은 이 useEffect가 마운트 시에만 실행되도록 합니다.

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('로그아웃 요청에 실패했습니다. 하지만 클라이언트에서는 로그아웃 처리합니다.', error);
    } finally {
      localStorage.removeItem('accessToken');
      alert('로그아웃 되었습니다.');
      navigate('/login');
    }
  };

  /**
   * 채팅 페이지로 이동하는 함수
   */
  const handleGoToChat = () => {
    navigate('/chat');
  };

  /**
   * 중고거래 페이지로 이동하는 함수
   */
  const handleGoToUsedProducts = () => {
    navigate('/used-products');
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* username이 있으면 환영 메시지를, 없으면 기본 메시지를 보여줍니다. */}
      {username ? (
        <h1>{username}님, 환영합니다!</h1>
      ) : (
        <h1>메인 페이지 입니다.</h1>
      )}
      <p>성공적으로 로그인하셨습니다!</p>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleGoToChat}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          채팅하기
        </button>
        <button
          onClick={handleGoToUsedProducts}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#479c56', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          중고거래하기
        </button>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default MainPage;
