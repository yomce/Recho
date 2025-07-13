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
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState(""); // 비밀번호 에러 상태
  const [passwordConfirmError, setPasswordConfirmError] = useState(""); // 비밀번호 확인 에러 상태
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 중복 및 유효성 확인 통과 여부 상태
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false); // 비밀번호 유효성 상태

  // 입력값이 변경되면 확인 상태를 초기화
  useEffect(() => {
    setIsIdChecked(false);
  }, [id]);

  useEffect(() => {
    setIsUsernameChecked(false);
  }, [username]);
  
  useEffect(() => {
    setIsEmailChecked(false);
  }, [email]);

  // [신규] 비밀번호 유효성 실시간 검사
  useEffect(() => {
    // 비밀번호 규칙 정의
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password && (!hasMinLength || !hasLetter || !hasNumber || !hasSpecialChar)) {
      setPasswordError("비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
      setIsPasswordValid(false);
    } else {
      setPasswordError("");
      // 비밀번호가 유효할 때만 isPasswordValid를 true로 설정 (빈 값이 아닐 때)
      setIsPasswordValid(password ? true : false);
    }

    // 비밀번호 일치 여부 확인
    if (confirmPassword && password !== confirmPassword) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordConfirmError("");
    }
  }, [password, confirmPassword]);

  // 아이디 중복 확인 핸들러
  const handleCheckId = async () => {
    if (!id) {
      setIdError("아이디를 입력해주세요.");
      return;
    }
    const hasLetter = /[a-zA-Z]/;
    const hasNumber = /[0-9]/;
    if (!hasLetter.test(id) || !hasNumber.test(id)) {
      setIdError("아이디는 영문과 숫자를 모두 포함해야 합니다.");
      setIsIdChecked(false);
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
  
  // 이메일 중복 확인 핸들러
  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }
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

  // [수정됨] 가입하기 버튼 클릭 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    // 최종 유효성 검사
    if (!isIdChecked) {
      setFormError("아이디 중복 및 유효성 확인을 해주세요.");
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
    if (!isPasswordValid) {
      setFormError("비밀번호가 보안 규칙에 맞지 않습니다.");
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

  const allChecksPassed = isIdChecked && isUsernameChecked && isEmailChecked && isPasswordValid && password === confirmPassword;

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
            {/* 아이디 */}
            <div className="flex items-start space-x-2">
              <div className="flex-grow">
                <TextInput
                  id="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="아이디 (영문, 숫자 조합)"
                />
                {idError && <p className="mt-1 text-sm text-error">{idError}</p>}
              </div>
              <button
                type="button"
                onClick={handleCheckId}
                className="btn-check-duplicate"
              >
                중복 확인
              </button>
            </div>

            {/* 닉네임 */}
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
                className="btn-check-duplicate"
              >
                중복 확인
              </button>
            </div>
            
            {/* 이메일 */}
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
                    className="btn-check-duplicate"
                >
                    중복 확인
                </button>
            </div>
            
            {/* 비밀번호 */}
            <div>
              <TextInput
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
              />
              {passwordError && <p className="mt-1 text-sm text-error">{passwordError}</p>}
            </div>
            
            {/* 비밀번호 확인 */}
            <div>
              <TextInput
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
              />
              {passwordConfirmError && <p className="mt-1 text-sm text-error">{passwordConfirmError}</p>}
            </div>

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
      {/* 스타일을 위한 CSS 추가 */}
      <style>{`
        .btn-check-duplicate {
          padding: 0 1rem;
          height: 2.5rem; // TextInput 높이와 맞추기 위해 조정
          margin-top: 1px;
          border: 1px solid transparent;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          color: white;
          background-color: var(--color-brand-blue);
          white-space: nowrap;
        }
        .btn-check-duplicate:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;