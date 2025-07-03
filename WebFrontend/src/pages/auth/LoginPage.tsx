// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import TextInput from '@/components/atoms/input/TextInput';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore.getState();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ id: id, password });
      alert('로그인 성공!');
      navigate('/main');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // handleRegisterClick 함수는 이제 Link 컴포넌트로 대체되므로 삭제합니다.

  return (
    // 커스텀 클래스 .centered-card-container 적용
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full">
          <img
            className="mx-auto h-12 w-auto"
            src="/RechoLogo.png"  
            alt="Recho Logo"
          />
          {/* 커스텀 클래스 .text-title 적용 */}
          <h2 className="mt-6 text-center text-body text-[var(--color-brand-text-primary)]">
            음악으로 나를 알리는 플랫폼
          </h2>
          <h3 className="mt-4 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            RECHO
          </h3>
        </div>

        {/* 커스텀 변수 --color-brand-default, --radius-card 적용 */}
        <div >
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            <div>
              {/* 1. 아이콘과 input을 감싸는 div에 relative 추가 */}
              <div className="relative mt-1">
                {/* 2. 아이콘을 담는 div (절대 위치로 배치) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  {/* User 아이콘 SVG */}
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* 3. input에 왼쪽 패딩(pl-10) 추가 */}
                <div>
                  <TextInput
                    id="id"
                    type="text" 
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="아이디를 입력해주세요."
                    icon={
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              {/* 1. 아이콘과 input을 감싸는 div에 relative 추가 */}
              <div className="relative mt-1">
                {/* 2. 아이콘을 담는 div (절대 위치로 배치) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  {/* Lock 아이콘 SVG */}
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* 3. input에 왼쪽 패딩(pl-10) 추가 */}
                <div>
                  <TextInput
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력해주세요."
                    icon={
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-disabled text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-caption text-[var(--color-brand-gray)]">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="text-navigation font-medium text-[var(--color-brand-blue)] hover:opacity-80">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-center text-error">{error}</p>}

            <div>
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </PrimaryButton>
            </div>
          </form>

           {/* 소셜 로그인 UI (커스텀 스타일 적용) */}
           <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[var(--color-brand-frame)] px-2 text-caption text-[var(--color-brand-gray)]">소셜 계정으로 로그인하기</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <a
                  href="#"
                  className="inline-flex w-full justify-center rounded-[var(--radius-button)] border border-gray-300 bg-[var(--color-brand-default)] py-2 px-4 text-navigation font-medium text-[var(--color-brand-gray)] hover:bg-gray-50"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">...</svg>
                  Google
                </a>
                {/* [수정] GitHub -> Kakao 로그인 버튼 */}
                <a
                  href="http://localhost:3000/auth/kakao" // 백엔드의 카카오 로그인 시작 API 주소
                  className="inline-flex w-full justify-center rounded-[var(--radius-button)] bg-[#FEE500] py-2 px-4 text-navigation font-medium text-black hover:opacity-90"
                >
                <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  {/* 카카오 로고 SVG Path */}
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.11 14.23l-.01.01-2.43-1.2-1.2 2.43c-.02.04-.06.07-.1.08-.04.02-.09.01-1.3-.7l-1.12-1.12c-.05-.05-.06-.12-.01-.17l2.43-4.21-4.21 2.43c-.05.04-.12.04-.17-.01l-1.12-1.12c-.71-1.2-.68-1.26-.7-1.3-.01-.04.01-.09.08-.1l2.43-1.2-1.2-2.43c-.04-.05-.04-.12.01-.17l1.12-1.12c1.2-.71 1.26-.68 1.3-.7.04-.01.09-.01.1.08l1.2 2.43 2.43-1.2c.05-.04.12-.04.17.01l1.12 1.12c.71 1.2.68 1.26.7 1.3.01.04-.01.09-.08.1l-2.43 1.2 1.2 2.43c.04.05.04.12-.01.17l-1.12 1.12c-.52.31-1.27.76-1.27.76z"/>
                </svg>
                  Kakao
                </a>
              </div>
            </div>
        </div>
        <p className="mt-10 text-center text-caption text-[var(--color-brand-gray)]">
          회원이 아니신가요?{' '}
          <Link
            to="/register"
            className="text-navigation font-semibold text-[var(--color-brand-blue)] hover:opacity-80"
          >
            회원가입 하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;