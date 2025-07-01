// src/pages/MainPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // jwt-decode 라이브러리 import
import axiosInstance from "../../services/axiosInstance"; // API 클라이언트 import
import Navigation from "../../components/layout/Navigation";

// 토큰에 담겨있는 payload의 타입 정의
interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  // 컴포넌트가 처음 렌더링될 때 사용자 정보를 설정합니다.
  useEffect(() => {
    // localStorage에서 accessToken을 가져옵니다.
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        // 토큰을 해독하여 payload를 추출합니다.
        const decodedToken = jwtDecode<JwtPayload>(token);
        // 해독된 payload에서 username을 가져와 state에 저장합니다.
        setUsername(decodedToken.username);
      } catch (error) {
        console.error("유효하지 않은 토큰입니다.", error);
        // 토큰이 유효하지 않으면 로그아웃 처리할 수도 있습니다.
        handleLogout();
      }
    }
  }, []); // 빈 배열은 이 useEffect가 마운트 시에만 실행되도록 합니다.

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error(
        "로그아웃 요청에 실패했습니다. 하지만 클라이언트에서는 로그아웃 처리합니다.",
        error
      );
    } finally {
      localStorage.removeItem("accessToken");
      alert("로그아웃 되었습니다.");
      navigate("/login");
    }
  };

  /**
   * [신규] 새 비디오 만들기 버튼 클릭 시 실행될 핸들러
   */
  const handleCreateVideo = () => {
    const message = {
      type: "CREATE_VIDEO",
    };

    // React Native WebView 환경인지 확인하고 postMessage를 호출합니다.
    // @ts-ignore
    if (window.ReactNativeWebView) {
      // @ts-ignore
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      console.log("Sent message to React Native: CREATE_VIDEO");
    } else {
      console.log(
        "ReactNativeWebView is not available. Are you running in a standard browser?"
      );
      // 웹 브라우저 환경일 때의 대체 동작 (예: 알림)
      alert("비디오 생성은 앱에서만 가능합니다.");
    }
  };

  /**
   * [신규] 마이페이지로 이동하는 함수
   */
  const handleGoToMyPage = () => {
    // localStorage에서 토큰을 가져와 userId를 추출합니다.
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        const userId = decodedToken.userId;
        navigate(`/users/${userId}`);
      } catch (error) {
        console.error("마이페이지 이동 실패: 유효하지 않은 토큰입니다.", error);
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
    } else {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  };

  /**
   * 채팅 페이지로 이동하는 함수
   */
  const handleGoToChat = () => {
    navigate("/chat");
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* username이 있으면 환영 메시지를, 없으면 기본 메시지를 보여줍니다. */}
      {username ? (
        <h1>{username}님, 환영합니다!</h1>
      ) : (
        <h1>메인 페이지 입니다.</h1>
      )}
      <p>성공적으로 로그인하셨습니다!</p>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        {/* "새 비디오 만들기" 버튼은 WebView에서만 보이도록 수정되었습니다. */}
        {/* ... */}
        {/* [신규] 마이페이지 버튼 추가 */}
        <button
          onClick={handleGoToMyPage}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#17a2b8", // 청록색 계열
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          마이페이지
        </button>
        <button
          onClick={handleCreateVideo}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#28a745", // 초록색 계열
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          새 비디오 만들기
        </button>
        <button
          onClick={handleGoToChat}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          채팅하기
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          로그아웃
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default MainPage;
