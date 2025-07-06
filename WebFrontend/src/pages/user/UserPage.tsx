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
  id: string;
  username: string;
}

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 현재 로그인한 사용자 정보를 가져옵니다.
    const token = localStorage.getItem("accessToken");
    if (token) {
      setCurrentUser(jwtDecode<JwtPayload>(token));
    }

    if (!id) {
      setError("사용자 ID가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // 프로필 정보와 썸네일 정보를 병렬로 가져옵니다.
        const [userResponse, thumbnailsResponse] = await Promise.all([
          axiosInstance.get<UserProfile>(`/users/${id}`),
          axiosInstance.get<string[]>(`/videos/thumbnails?id=${id}`),
        ]);

        setUser(userResponse.data);
        setThumbnails(thumbnailsResponse.data);
      } catch (err) {
        setError("사용자 정보를 가져오는 중 오류가 발생했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

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
  const isMyProfile = currentUser?.id === user?.id;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        뒤로가기
      </button>
      {user ? (
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
      ) : (
        <p>사용자 정보를 찾을 수 없습니다.</p>
      )}

      {/* 내가 올린 비디오 썸네일 섹션 */}
      {thumbnails.length > 0 && (
        <div style={styles.thumbnailsSection}>
          <h2 style={styles.sectionTitle}>업로드한 비디오</h2>
          <div style={styles.thumbnailsGrid}>
            {thumbnails.map((url, index) => (
              <div key={index} style={styles.thumbnailContainer}>
                <img
                  src={url}
                  alt={`user video thumbnail ${index + 1}`}
                  style={styles.thumbnailImage}
                />
              </div>
            ))}
          </div>
        </div>
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

  // 썸네일 섹션 스타일
  thumbnailsSection: { marginTop: "40px" },
  sectionTitle: {
    fontSize: "1.5em",
    color: "#333",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
    marginBottom: "20px",
  },
  thumbnailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "15px",
  },
  thumbnailContainer: {
    position: "relative",
    paddingBottom: "100%", // 1:1 비율
    backgroundColor: "#eee",
    borderRadius: "8px",
    overflow: "hidden",
  },
  thumbnailImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};

export default UserPage;
