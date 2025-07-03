// src/pages/auth/ForgotPasswordPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';
import TextInput from '@/components/atoms/input/TextInput';
import axiosInstance from '@/services/axiosInstance'; // axios 인스턴스 import

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // [수정] 입력 폼 상태 이름 변경
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // 1. 인증번호 발송 핸들러
  const handleSendCode = async () => {
    setError(null);
    if (!username || !email) {
      setError('아이디와 이메일을 모두 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      // [수정] 아이디와 이메일로 인증번호 발송 API 호출
      await axiosInstance.post('/auth/password/send-email', { username, email });
      alert('입력하신 이메일로 인증번호가 발송되었습니다.');
      setIsCodeSent(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '인증번호 발송에 실패했습니다.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 2. 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // [수정] 이메일과 코드로 인증번호 확인 API 호출
      await axiosInstance.post('/auth/password/verify-code', { email, code: verificationCode });
      alert('인증에 성공했습니다.');
      setIsCodeVerified(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '인증번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 최종 비밀번호 변경 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isCodeVerified) {
      setError('이메일 인증을 먼저 완료해주세요.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('새로운 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      // [수정] 최종 비밀번호 변경 API 호출
      await axiosInstance.post('/auth/password/reset', {
        email,
        code: verificationCode,
        password: newPassword,
      });
      alert('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        {/* ... 로고, 헤더 부분은 동일 ... */}
        <div className="sm:mx-auto sm:w-full">
          <Link to="/login">
            <img className="mx-auto h-12 w-auto" src="/RechoLogo.png" alt="Recho Logo" />
          </Link>
          <h2 className="mt-6 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            비밀번호 찾기
          </h2>
        </div>
        
        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* [수정] 아이디 입력 */}
            <TextInput
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디"
              disabled={isCodeVerified}
            />

            {/* [수정] 이메일 입력 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입 시 사용한 이메일"
                disabled={isCodeSent}
              />
              <SecondaryButton
                type="button"
                onClick={handleSendCode}
                disabled={isCodeSent || isLoading}
                style={{ height: '34.8px' }}
              >
                {isLoading && isCodeSent === false ? '발송 중...' : '인증번호 발송'}
              </SecondaryButton>
            </div>

            {/* 인증번호 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="인증번호"
                disabled={!isCodeSent || isCodeVerified}
              />
              <SecondaryButton
                type="button"
                onClick={handleVerifyCode}
                disabled={!isCodeSent || isCodeVerified || isLoading}
                style={{ height: '34.8px' }}
              >
                {isLoading && isCodeVerified === false ? '확인 중...' : '확인'}
             </SecondaryButton>
            </div>
            
            {isCodeVerified && <div className="border-t border-gray-200" />}

            {/* 새로운 비밀번호 */}
            <TextInput
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새로운 비밀번호"
              disabled={!isCodeVerified}
            />

            {/* 비밀번호 확인 */}
            <TextInput
              id="confirmNewPassword"
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="새로운 비밀번호 확인"
              disabled={!isCodeVerified}
            />

            {error && <p className="text-center text-error">{error}</p>}

            <div className="pt-2">
              <PrimaryButton type="submit" disabled={!isCodeVerified || isLoading}>
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </PrimaryButton>
            </div>
          </form>
        </div>

        <p className="mt-10 text-center text-caption text-[var(--color-brand-gray)]">
          <Link
            to="/login"
            className="text-navigation font-semibold text-[var(--color-brand-blue)] hover:opacity-80"
          >
            로그인 페이지로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;