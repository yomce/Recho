// src/pages/user/UserPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../services/axiosInstance";

// 사용자 프로필 데이터 타입을 정의합니다.
interface UserProfile {
  id: string;
  username: string;
  email: string;
  profileUrl: string | null;
  intro: string | null;
  createdAt: string;
}

// JWT 페이로드 타입
interface JwtPayload {
  userId: string;
  username: string;
}

// 1. Mock Data를 정의합니다. 실제 API 연동 시 이 부분은 API 호출로 대체됩니다.
const mockVideos = [
  {
    videoId: "vid001",
    thumbnailUrl:
      "https://via.placeholder.com/300x200.png?text=Remixable+Video+1",
  },
  {
    videoId: "vid002",
    thumbnailUrl:
      "https://via.placeholder.com/300x200.png?text=Remixable+Video+2",
  },
  {
    videoId: "vid003",
    thumbnailUrl:
      "https://via.placeholder.com/300x200.png?text=Remixable+Video+3",
  },
  {
    videoId: "vid004",
    thumbnailUrl:
      "https://via.placeholder.com/300x200.png?text=Remixable+Video+4",
  },
];

const UserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 현재 로그인한 사용자 정보를 가져옵니다.
    const token = localStorage.getItem("accessToken");
    if (token) {
      setCurrentUser(jwtDecode<JwtPayload>(token));
    }

    if (!userId) {
      setError("사용자 ID가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get<UserProfile>(
          `/users/${userId}`
        );
        setUser(response.data);
      } catch (err) {
        setError("사용자 정보를 찾을 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  /**
   * [신규] DM 보내기 버튼 클릭 시 실행되는 함수
   */
  const handleSendDm = async () => {
    if (!user) return;
    try {
      // 백엔드의 POST /chat/dm API를 호출합니다.
      const response = await axiosInstance.post("/chat/dm", {
        partnerId: user.id, // 현재 보고 있는 프로필 유저의 ID를 전송
      });

      const room = response.data;
      // 성공적으로 방이 생성/조회되면 해당 채팅방으로 이동합니다.
      navigate(`/chat/${room.id}`);
    } catch (err) {
      console.error("DM 채팅방 생성에 실패했습니다.", err);
      alert("DM을 시작할 수 없습니다.");
    }
  };

  // [신규] 리믹스하기 버튼 클릭 시 실행될 핸들러
  const handleRemixClick = (videoId: string) => {
    console.log(`Start Remixing video with ID: ${videoId}`);

    // postMessage로 네이티브 앱에 리믹스할 비디오 ID를 전달합니다.
    const message = {
      type: "EDIT_VIDEO", // 'EDIT_VIDEO' 타입은 "리믹스를 시작하라"는 의미로 재사용합니다.
      payload: {
        videoId: videoId,
      },
    };

    // @ts-ignore - window.ReactNativeWebView는 브라우저 환경에 없습니다.
    if (window.ReactNativeWebView) {
      // @ts-ignore
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      console.log(
        "ReactNativeWebView is not available. Are you running in a standard browser?"
      );
    }
  };

  if (loading)
    return (
      <div style={styles.container}>
        <h2>로딩 중...</h2>
      </div>
    );
  if (error)
    return (
      <div style={styles.container}>
        <h2>에러: {error}</h2>
      </div>
    );

  // 현재 보고 있는 프로필이 내 프로필인지 확인
  const isMyProfile = currentUser?.userId === user?.id;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        뒤로가기
      </button>
      {user ? (
        <>
          <div style={styles.profileCard}>
            <img
              src={
                user.profileUrl ||
                `https://placehold.co/150x150/e9ecef/495057?text=${user.username.charAt(
                  0
                )}`
              }
              alt={`${user.username}의 프로필 사진`}
              style={styles.profileImage}
            />
            <h1 style={styles.username}>{user.username}</h1>
            <p style={styles.userId}>@{user.id}</p>

            {/* 내 프로필이 아닐 경우에만 DM 보내기 버튼을 보여줍니다. */}
            {!isMyProfile && (
              <button onClick={handleSendDm} style={styles.dmButton}>
                DM 보내기
              </button>
            )}

            <p style={styles.email}>{user.email}</p>
            <p style={styles.intro}>{user.intro || "자기소개가 없습니다."}</p>
            <p style={styles.joinDate}>
              가입일: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* 3. [신규] 비디오 목록 섹션 */}
          <div style={styles.videoSection}>
            <h2 style={styles.sectionTitle}>{user.username}의 비디오 목록</h2>
            <div style={styles.gridContainer}>
              {mockVideos.map((video) => (
                <div key={video.videoId} style={styles.videoItem}>
                  <img
                    src={video.thumbnailUrl}
                    alt={`Thumbnail for ${video.videoId}`}
                    style={styles.thumbnail}
                  />
                  <div style={styles.buttonContainer}>
                    <button
                      style={styles.remixButton}
                      onClick={() => handleRemixClick(video.videoId)}
                    >
                      리믹스하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p>사용자 정보를 찾을 수 없습니다.</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "sans-serif",
  },
  profileCard: {
    textAlign: "center",
    padding: "40px",
    border: "1px solid #eee",
    borderRadius: "15px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  profileImage: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "20px",
    border: "4px solid white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  username: { margin: "0 0 5px 0", fontSize: "2em", color: "#333" },
  userId: { margin: "0 0 20px 0", fontSize: "1em", color: "#888" },
  dmButton: {
    padding: "10px 25px",
    fontSize: "1em",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "20px",
    marginBottom: "20px",
  },
  email: { margin: "0 0 15px 0", fontSize: "1em", color: "#555" },
  intro: {
    margin: "0 0 20px 0",
    fontSize: "1.1em",
    color: "#666",
    minHeight: "40px",
  },
  joinDate: { fontSize: "0.9em", color: "#aaa" },
  backButton: {
    marginBottom: "20px",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#6c757d",
    color: "white",
    cursor: "pointer",
  },

  // 4. [신규] 비디오 목록 관련 스타일 추가
  videoSection: {
    marginTop: "40px",
  },
  sectionTitle: {
    fontSize: "1.8em",
    color: "#333",
    paddingBottom: "10px",
    borderBottom: "2px solid #eee",
    marginBottom: "20px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  },
  videoItem: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  thumbnail: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  buttonContainer: {
    padding: "10px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
  },
  remixButton: {
    width: "100%",
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#28a745",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default UserPage;
