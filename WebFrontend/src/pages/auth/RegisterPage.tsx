// src/pages/RegisterPage.tsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import TextInput from "@/components/atoms/input/TextInput";
import axiosInstance from "@/services/axiosInstance";
import { AxiosError } from "axios";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // 폼 입력 상태
  const [id, setId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 에러 및 로딩 상태
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState<"id" | "username" | "email" | "submit" | null>(null);

  // 단계별 인증 완료 상태 (ForgotPasswordPage와 동일한 로직)
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [isUsernameVerified, setIsUsernameVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // 1. 아이디 중복 확인 핸들러
  const handleCheckId = async () => {
    setError("");
    if (!id) {
      setError("아이디를 입력해주세요.");
      return;
    }
    const hasLetter = /[a-zA-Z]/;
    const hasNumber = /[0-9]/;
    if (!hasLetter.test(id) || !hasNumber.test(id)) {
      setError("아이디는 영문과 숫자를 모두 포함해야 합니다.");
      return;
    }
    setLoadingState("id");
    try {
      await axiosInstance.post("/users/check-id", { id });
      alert("사용 가능한 아이디입니다.");
      setIsIdVerified(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "사용할 수 없는 아이디입니다.");
    } finally {
      setLoadingState(null);
    }
  };

  // 2. 닉네임 중복 확인 핸들러
  const handleCheckUsername = async () => {
    setError("");
    if (!username) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setLoadingState("username");
    try {
      await axiosInstance.post("/users/check-username", { username });
      alert("사용 가능한 닉네임입니다.");
      setIsUsernameVerified(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "사용할 수 없는 닉네임입니다.");
    } finally {
      setLoadingState(null);
    }
  };

  // 3. 이메일 중복 확인 핸들러
  const handleCheckEmail = async () => {
    setError("");
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setLoadingState("email");
    try {
      await axiosInstance.post("/users/check-email", { email });
      alert("사용 가능한 이메일입니다.");
      setIsEmailVerified(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "사용할 수 없는 이메일입니다.");
    } finally {
      setLoadingState(null);
    }
  };

  // 4. 최종 가입하기 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isIdVerified || !isUsernameVerified || !isEmailVerified) {
      setError("모든 항목의 중복 확인을 완료해주세요.");
      return;
    }
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password || !confirmPassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecialChar) {
      setError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoadingState("submit");
    try {
      await axiosInstance.post("users", { id, username, email, password });
      alert("회원가입에 성공했습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string | string[] }>;
      const errorMessage = Array.isArray(axiosError.response?.data?.message)
        ? axiosError.response?.data?.message[0]
        : axiosError.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoadingState(null);
    }
  };

  return (
    <div className="centered-card-container px-4">
      <div className="w-full max-w-md">
        <div className="sm:mx-auto sm:w-full">
          <img className="mx-auto h-12 w-auto" src="/vite.svg" alt="Recho Logo" />
          <h2 className="mt-6 text-center text-subheadline text-[var(--color-brand-text-primary)]">
            회원가입
          </h2>
        </div>

        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* 아이디 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="id"
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디 (영문, 숫자 조합)"
                disabled={isIdVerified}
              />
              <SecondaryButton
                type="button"
                onClick={handleCheckId}
                disabled={isIdVerified || loadingState !== null}
                style={{ height: '34.8px', flexShrink: 0 }}
              >
                {loadingState === "id" ? "확인 중..." : "중복 확인"}
              </SecondaryButton>
            </div>

            {/* 닉네임 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="닉네임"
                disabled={!isIdVerified || isUsernameVerified}
              />
              <SecondaryButton
                type="button"
                onClick={handleCheckUsername}
                disabled={!isIdVerified || isUsernameVerified || loadingState !== null}
                style={{ height: '34.8px', flexShrink: 0 }}
              >
                {loadingState === "username" ? "확인 중..." : "중복 확인"}
              </SecondaryButton>
            </div>

            {/* 이메일 */}
            <div className="flex items-center space-x-2">
              <TextInput
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                disabled={!isUsernameVerified || isEmailVerified}
              />
              <SecondaryButton
                type="button"
                onClick={handleCheckEmail}
                disabled={!isUsernameVerified || isEmailVerified || loadingState !== null}
                style={{ height: '34.8px', flexShrink: 0 }}
              >
                {loadingState === "email" ? "확인 중..." : "중복 확인"}
              </SecondaryButton>
            </div>
            
            {isEmailVerified && <div className="border-t border-gray-200" />}

            {/* 비밀번호 */}
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (영문, 숫자, 특수문자 조합 8자 이상)"
              disabled={!isEmailVerified}
            />

            {/* 비밀번호 확인 */}
            <TextInput
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 확인"
              disabled={!isEmailVerified}
            />

            {error && <p className="text-center text-error">{error}</p>}

            <div className="pt-2">
              <PrimaryButton type="submit" disabled={!isEmailVerified || loadingState !== null}>
                {loadingState === "submit" ? "가입하는 중..." : "가입하기"}
              </PrimaryButton>
            </div>
          </form>
        </div>

        <p className="mt-10 text-center text-caption text-[var(--color-brand-gray)]">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-navigation font-semibold text-[var(--color-brand-blue)] hover:opacity-80">
            로그인 하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;