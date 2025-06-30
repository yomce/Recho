// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router 사용을 가정
import PrimaryButton from '@/components/atoms/button/PrimaryButton';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ id, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      const { accessToken } = data;

      localStorage.setItem('accessToken', accessToken);

      alert('로그인 성공!');
      navigate('/main');

    } catch (err) {
      if (err instanceof Error) {
        console.error('Login error:', err);
        setError(err.message);
      } else {
        setError('알 수 없는 에러가 발생했습니다.');
      }
    }
  };

  // 회원가입 버튼 클릭 핸들러
  const handleRegisterClick = () => {
    navigate('/register'); // '/register' 경로로 이동
  };

  return (
    <div className="app-container flex flex-col justify-center w-full px-4">
      <h1 className='w-full text-center text-title'>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="id" className="block mb-1 text-body">아이디</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full p-2 rounded border border-brand-frame text-body"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 text-body">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded border border-brand-frame text-body"
          />
        </div>
        {error && <p className="text-error mb-2">{error}</p>}
          <PrimaryButton>로그인</PrimaryButton>
      </form>
      {/* 회원가입 버튼 추가 */}
      <div className="mt-4 text-center">
        <p className="mb-2 text-caption text-brand-text-secondary">계정이 없으신가요?</p>
        <button 
          onClick={handleRegisterClick} 
          className="w-full py-2 bg-brand-gray text-white rounded-button text-button cursor-pointer"
        >
          회원가입
        </button>
      </div>
    </div>
  );
};
export default LoginPage;