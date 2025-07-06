import React from "react";

const Loading: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        fontSize: "20px",
        color: "white",
        backgroundColor: "#1E293B", // 다크 테마 배경색
        zIndex: 999, // 다른 요소들 위에 표시되도록 z-index 추가
      }}
    >
      <p>VINYL이 로딩중입니다.</p>
    </div>
  );
};

export default Loading;
