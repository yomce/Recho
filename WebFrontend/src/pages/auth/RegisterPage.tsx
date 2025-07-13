// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
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
  const [idError, setIdError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState(""); // 이메일 에러 상태 추가
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 중복 확인 통과 여부 상태
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false); // 이메일 확인 상태 추가

  // 입력값이 변경되면 중복 확인 상태를 초기화
  useEffect(() => {
    setIsIdChecked(false);
  }, [id]);

  useEffect(() => {
    setIsUsernameChecked(false);
  }, [username]);
  
  useEffect(() => {
    setIsEmailChecked(false);
  }, [email]); // 이메일 확인 상태 초기화 effect 추가

  // 아이디 중복 확인 핸들러
  const handleCheckId = async () => {
    if (!id) {
      setIdError("아이디를 입력해주세요.");
      return;
    }
    try {
      await axiosInstance.post("/users/check-id", { id });
      setIdError("");
      alert("사용 가능한 아이디입니다.");
      setIsIdChecked(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setIdError(error.response?.data?.message || "아이디 중복 확인 실패");
      setIsIdChecked(false);
    }
  };

  // 닉네임 중복 확인 핸들러
  const handleCheckUsername = async () => {
    if (!username) {
      setUsernameError("닉네임을 입력해주세요.");
      return;
    }
    try {
      await axiosInstance.post("/users/check-username", { username });
      setUsernameError("");
      alert("사용 가능한 닉네임입니다.");
      setIsUsernameChecked(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setUsernameError(error.response?.data?.message || "닉네임 중복 확인 실패");
      setIsUsernameChecked(false);
    }
  };
  
  // (신규) 이메일 중복 확인 핸들러
  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }
    // 간단한 이메일 형식 검사
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    try {
      await axiosInstance.post("/users/check-email", { email });
      setEmailError("");
      alert("사용 가능한 이메일입니다.");
      setIsEmailChecked(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setEmailError(error.response?.data?.message || "이메일 중복 확인 실패");
      setIsEmailChecked(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    // 유효성 검사
    if (!isIdChecked) {
      setFormError("아이디 중복 확인을 해주세요.");
      return;
    }
    if (!isUsernameChecked) {
      setFormError("닉네임 중복 확인을 해주세요.");
      return;
    }
    if (!isEmailChecked) {
      setFormError("이메일 중복 확인을 해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.post("users", {
        id,
        username,
        email,
        password,
      });

      alert("회원가입에 성공했습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Registration error:", err);
      const errorMessage = Array.isArray(error.response?.data?.message)
        ? error.response?.data?.message[0]
        : error.response?.data?.message || "알 수 없는 에러가 발생했습니다.";
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 중복 확인이 완료되었는지 여부
  const allChecksPassed = isIdChecked && isUsernameChecked && isEmailChecked;

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

        <div>
          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            {/* 아이디 입력 그룹 */}
            <div className="flex items-start space-x-2">
              <div className="flex-grow">
                <TextInput
                  id="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="아이디를 입력해주세요"
                />
                {idError && <p className="mt-1 text-sm text-error">{idError}</p>}
              </div>
              <button
                type="button"
                onClick={handleCheckId}
                className="px-4 py-2 mt-px border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue whitespace-nowrap"
              >
                중복 확인
              </button>
            </div>

            {/* 닉네임 입력 그룹 */}
            <div className="flex items-start space-x-2">
              <div className="flex-grow">
                <TextInput
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="닉네임을 입력해주세요"
                />
                {usernameError && <p className="mt-1 text-sm text-error">{usernameError}</p>}
              </div>
              <button
                type="button"
                onClick={handleCheckUsername}
                className="px-4 py-2 mt-px border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue whitespace-nowrap"
              >
                중복 확인
              </button>
            </div>
            
            {/* 이메일 입력 그룹 */}
            <div className="flex items-start space-x-2">
                <div className="flex-grow">
                    <TextInput
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력해주세요"
                    />
                    {emailError && <p className="mt-1 text-sm text-error">{emailError}</p>}
                </div>
                <button
                    type="button"
                    onClick={handleCheckEmail}
                    className="px-4 py-2 mt-px border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue whitespace-nowrap"
                >
                    중복 확인
                </button>
            </div>
            
            {/* 비밀번호 */}
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
            />
            
            {/* 비밀번호 확인 */}
            <TextInput
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 한번 더 입력해주세요"
            />

            {formError && <p className="text-center text-error">{formError}</p>}

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                disabled={isLoading || !allChecksPassed}
              >
                {isLoading ? "가입하는 중..." : "가입하기"}
              </PrimaryButton>
            </div>
          </form>
        </div>

        <p className="mt-10 text-center text-caption text-[var(--color-brand-gray)]">
          이미 계정이 있으신가요?{" "}
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