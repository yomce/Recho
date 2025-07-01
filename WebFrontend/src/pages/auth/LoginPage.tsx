// src/pages/LoginPage.tsx (수정 완료)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore'; // Zustand 스토어 import
import PrimaryButton from '@/components/atoms/button/PrimaryButton';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // Zustand 스토어에서 login 함수를 가져옵니다.
  // 컴포넌트의 리렌더링과 관련 없는 함수는 getState()로 가져오는 것이 효율적입니다.
  const { login } = useAuthStore.getState();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 스토어의 login 함수를 호출합니다.
      await login({ id, password });
      
      alert('로그인 성공!');
      navigate('/main'); // 로그인 성공 시 메인 페이지로 이동

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 에러가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-brand-frame p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-card shadow-md">
        <h1 className='w-full text-center text-title mb-8'>로그인</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="id" className="block mb-2 font-semibold text-brand-text-secondary">아이디</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              className="w-full p-3 rounded-button border border-brand-frame text-body focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 font-semibold text-brand-text-secondary">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-button border border-brand-frame text-body focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            />
          </div>
          
          {error && <p className="text-error text-center mb-4">{error}</p>}
          
          <PrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </PrimaryButton>
        </form>

        <div className="mt-6 text-center">
          <p className="mb-2 text-caption text-brand-text-secondary">계정이 없으신가요?</p>
          <button 
            onClick={handleRegisterClick} 
            className="w-full py-3 bg-brand-gray text-white rounded-button text-button cursor-pointer transition-colors hover:bg-opacity-80"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;