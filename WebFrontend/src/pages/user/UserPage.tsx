// src/pages/UserPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';

// 사용자 프로필 데이터 타입을 정의합니다.
interface UserProfile {
  id: string;
  username: string;
  email: string;
  profileUrl: string | null;
  intro: string | null;
  createdAt: string;
}

const UserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>(); // URL에서 userId 파라미터 가져오기
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('사용자 ID가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // 백엔드의 GET /users/:id API를 호출합니다.
        const response = await axiosInstance.get<UserProfile>(`/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        console.error('사용자 정보를 불러오는 데 실패했습니다.', err);
        setError('사용자 정보를 찾을 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) return <div style={styles.container}><h2>로딩 중...</h2></div>;
  if (error) return <div style={styles.container}><h2>에러: {error}</h2></div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>뒤로가기</button>
      {user ? (
        <div style={styles.profileCard}>
          <img 
            src={user.profileUrl || `https://placehold.co/150x150/e9ecef/495057?text=${user.username.charAt(0)}`} 
            alt={`${user.username}의 프로필 사진`}
            style={styles.profileImage}
          />
          <h1 style={styles.username}>{user.username}</h1>
          <p style={styles.userId}>@{user.id}</p>
          <p style={styles.email}>{user.email}</p>
          <p style={styles.intro}>{user.intro || '자기소개가 없습니다.'}</p>
          <p style={styles.joinDate}>가입일: {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>사용자 정보를 찾을 수 없습니다.</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' },
  profileCard: { textAlign: 'center', padding: '40px', border: '1px solid #eee', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  profileImage: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px', border: '4px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  username: { margin: '0 0 5px 0', fontSize: '2em', color: '#333' },
  userId: { margin: '0 0 15px 0', fontSize: '1em', color: '#888' },
  email: { margin: '0 0 15px 0', fontSize: '1em', color: '#555' },
  intro: { margin: '0 0 20px 0', fontSize: '1.1em', color: '#666', minHeight: '40px' },
  joinDate: { fontSize: '0.9em', color: '#aaa' },
  backButton: { marginBottom: '20px', padding: '10px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer' }
};

export default UserPage;
