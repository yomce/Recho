// src/pages/auth/ForgotPasswordPage.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import SecondaryButton from '@/components/atoms/button/SecondaryButton';
import TextInput from '@/components/atoms/input/TextInput';


const ForgotPasswordPage: React.FC = () => {
  // 입력 폼 상태
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // UI 상태
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 인증 절차 상태
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // 1. 인증번호 발송 핸들러
  const handleSendCode = async () => {
    // TODO: 휴대폰 번호로 인증번호를 발송하는 API 호출 로직
    console.log(`${phoneNumber}로 인증번호 발송 요청`);
    alert('인증번호가 발송되었습니다.');
    setIsCodeSent(true);
  };
  
  // 2. 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    // TODO: 입력된 인증번호를 확인하는 API 호출 로직
    console.log(`입력된 코드 ${verificationCode} 확인 요청`);
    // 성공 시
    alert('인증에 성공했습니다.');
    setIsCodeVerified(true);
    setError('인증번호가 올바르지 않습니다.'); // 실패 시 에러 메시지 설정
  };

  // 3. 최종 비밀번호 변경 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isCodeVerified) {
      setError('휴대폰 인증을 먼저 완료해주세요.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('새로운 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 새로운 비밀번호로 변경하는 API 호출 로직
      console.log(`${email} 계정의 비밀번호를 변경합니다.`);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      // navigate('/login'); // 성공 후 로그인 페이지로 이동
    } catch (err) {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full">
          <Link to="/login">
            <img
              className="mx-auto h-12 w-auto"
              src="/RechoLogo.png"
              alt="Recho Logo"
            />
          </Link>
          <h2 className="mt-6 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            비밀번호 찾기
          </h2>
        </div>

        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* 이메일 */}
            <TextInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입 시 사용한 이메일"
              disabled={isCodeVerified}
            />

            {/* 휴대폰 번호 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="휴대폰 번호 ('-' 제외)"
                disabled={isCodeSent}
              />
              <SecondaryButton
                type="button"
                onClick={handleSendCode}
                disabled={isCodeSent}
                style={{ height: '34.8px' }}
              >
                    인증번호 발송
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
                disabled={!isCodeSent || isCodeVerified}
                style={{ height: '34.8px' }}
              >
                확인
             </SecondaryButton>
            </div>
            
            {/* --- 구분선 --- */}
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