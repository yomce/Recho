// src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import TextInput from '@/components/atoms/input/TextInput';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // 폼 입력 및 로딩 상태
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true); // 로딩 시작

    try {
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message[0] || '회원가입에 실패했습니다.');
      }

      alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
      navigate('/login');

    } catch (err) {
      if (err instanceof Error) {
        console.error('Registration error:', err);
        setError(err.message);
      } else {
        setError('알 수 없는 에러가 발생했습니다.');
      }
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full">
          <img
            className="mx-auto h-12 w-auto"
            src="/RechoLogo.png"
            alt="Recho Logo"
          />
          <h2 className="mt-6 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            회원가입
          </h2>
        </div>

        {/* 폼 UI를 로그인 페이지와 통일 */}
        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* 아이디 */}
            <TextInput
              id="id"
              type="text"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력해주세요"
              icon={
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />
            {/* 닉네임 */}
            <TextInput
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="닉네임을 입력해주세요"
              icon={
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            {/* 이메일 */}
            <TextInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력해주세요"
              icon={
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />
            {/* 비밀번호 */}
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              icon={
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              }
            />
            {/* 비밀번호 확인 */}
            <TextInput
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 한번 더 입력해주세요"
              icon={
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              }
            />

            {error && <p className="text-center text-error">{error}</p>}

            <div className='pt-2'>
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? '가입하는 중...' : '가입하기'}
              </PrimaryButton>
            </div>
          </form>
        </div>

        <p className="mt-10 text-center text-caption text-[var(--color-brand-gray)]">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="text-navigation font-semibold text-[var(--color-brand-blue)] hover:opacity-80"
          >
            로그인 하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;