// src/pages/LoginPage.tsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import TextInput from "@/components/atoms/input/TextInput";
import { useConfigStore } from '@/stores/useConfigStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.actions.login);
  const kakaoCallbackUrl = useConfigStore((state) => state.config?.kakaoCallbackUrl);
  const googleLoginUrl = useConfigStore((state) => state.config?.googleLoginUrl);
  
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ id: id, password });
      alert("로그인 성공!");
      navigate("/main");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full">
          <img
            className="mx-auto w-[150px] h-[150px]"
            src="/vite.svg"
            alt="Recho Logo"
          />
          <h2 className="mt-6 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            음악으로 나를 알리는 플랫폼
            <br /> Recho
          </h2>
        </div>

        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            <div>
              <div className="relative mt-1">
                <TextInput
                  id="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="아이디를 입력해주세요."
                  icon={
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            </div>

            <div>
              <div className="relative mt-1">
                <TextInput
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  icon={
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-navigation font-medium text-[var(--color-brand-blue)] hover:opacity-80"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-center text-error">{error}</p>}

            <div>
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </PrimaryButton>
            </div>
          </form>

          {/* 소셜 로그인 UI */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[var(--color-brand-frame)] px-2 text-caption text-[var(--color-brand-gray)]">
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href={googleLoginUrl}
                className="inline-flex w-full justify-center rounded-[var(--radius-button)] border border-gray-300 bg-white py-2 px-4 text-navigation font-medium text-gray-500 hover:bg-gray-50"
              >
                {/* --- Google 로고 SVG (수정됨) --- */}
                <svg
                  className="mr-3 h-5 w-5"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z"
                    fill="currentColor"
                  ></path>
                </svg>
                Google
              </a>
              <a
                href={kakaoCallbackUrl}
                className="inline-flex w-full justify-center rounded-[var(--radius-button)] bg-[#FEE500] py-2 px-4 text-navigation font-medium text-black hover:opacity-90"
              >
                <svg
                  className="mr-3 h-5 w-5"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12.1,2C6.5,2,2,5.7,2,10.2c0,3.1,2,5.8,5,7.1c-0.2,0.7-0.7,2-0.8,2.3c-0.1,0.3,0,0.5,0.2,0.7c0.2,0.1,0.5,0.1,0.7,0c0.3-0.1,2.5-1.5,3.7-2.3c0.4,0,0.8,0.1,1.2,0.1c5.6,0,10.1-3.7,10.1-8.2S17.7,2,12.1,2z"
                  ></path>
                </svg>
                Kakao
              </a>
            </div>
          </div>
        </div>
        <p className="mt-9 text-center text-caption text-[var(--color-brand-gray)]">
          회원이 아니신가요?{" "}
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