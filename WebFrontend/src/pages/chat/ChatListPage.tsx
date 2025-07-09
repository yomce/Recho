// src/pages/ChatListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
// import { socket } from '../../services/socket'; // ⬅️ 직접 사용하지 않으므로 삭제해도 무방
import { useAuthStore } from '../../stores/authStore';

// --- 타입 정의 ---
interface ChatUser {
  id: string;
  username: string;
  profileUrl?: string | null;
}
interface UserRoom {
  user: ChatUser;
}
interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
  userRooms: UserRoom[];
}
// --- Avatar 컴포넌트 ---
const Avatar: React.FC<{
  src?: string | null;
  alt?: string;
  style?: React.CSSProperties;
}> = ({ src, alt = '?', style }) => (
  <img
    src={
      src || `https://placehold.co/32x32/e9ecef/495057?text=${alt.charAt(0)}`
    }
    alt={alt}
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      ...style,
    }}
  />
);

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  // ❗️ useEffect에서 socket 직접 제어 로직 제거
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchChatRooms = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<ChatRoom[]>('/chat/my-rooms');
        setRooms(response.data);
      } catch (err) {
        console.error('채팅방 목록을 불러오는 데 실패했습니다.', err);
        setError('채팅방 목록을 불러올 수 없습니다. 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
    
    // ❗️ socket.connect() 와 socket.disconnect()를 여기서 호출하지 않습니다.
    // 소켓 관리는 App.tsx와 chatStore가 전역으로 담당합니다.

  }, [user]);

  // ... (이하 핸들러 및 렌더링 코드는 모두 동일)
  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoomName.trim()) return alert('채팅방 이름을 입력해주세요.');

    try {
      const response = await axiosInstance.post<ChatRoom>('/chat/rooms', {
        name: newRoomName,
        type: 'GROUP',
      });
      setNewRoomName('');
      alert(`'${response.data.name}' 방이 생성되었습니다!`);
      const roomsResponse = await axiosInstance.get<ChatRoom[]>('/chat/my-rooms');
      setRooms(roomsResponse.data);
    } catch (err) {
      console.error('채팅방 생성에 실패했습니다.', err);
      alert('채팅방 생성에 실패했습니다.');
    }
  };
  const handleEnterRoom = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) return <div style={styles.container}><h2>채팅방 정보를 불러오고 있습니다...</h2></div>;
  if (error) return <div style={styles.container}><h2>에러: {error}</h2></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>채팅</h1>
      <form onSubmit={handleCreateRoom} style={styles.createForm}>
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="새 그룹 채팅방 이름"
          style={styles.input}
        />
        <button type="submit" style={styles.createButton}>
          만들기
        </button>
      </form>
      <h2 style={styles.subHeader}>채팅방 목록</h2>
      <div style={styles.roomList}>
        {rooms.length > 0 ? (
          rooms.map((room) => {
            const isPrivate = room.type === 'PRIVATE';
            const participants = room.userRooms?.map((ur) => ur.user) || [];
            const chatPartner = isPrivate
              ? participants.find((p) => p.id !== user?.id)
              : null;
            const participantNamesString = participants
              .map(p => p.username)
              .join(', ');
            return (
              <div key={room.id} style={styles.roomItem} onClick={() => handleEnterRoom(room.id)}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isPrivate ? (
                    <Avatar
                      src={chatPartner?.profileUrl}
                      alt={chatPartner?.username}
                    />
                  ) : (
                    <div style={{ display: 'flex', position: 'relative', width: '48px', height: '32px' }}>
                      {participants.slice(0, 2).map((p, index) => (
                        <div key={p.id} style={{ position: 'absolute', left: `${index * 16}px` }}>
                           <Avatar src={p.profileUrl} alt={p.username} style={{ border: '2px solid white' }}/>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <p style={styles.roomName}>
                      {isPrivate ? chatPartner?.username || '개인 채팅' : room.name}
                    </p>
                    {!isPrivate && (
                        <p style={styles.participantCount}>
                        {participantNamesString}
                        </p>
                    )}
                  </div>
                </div>
                <span style={styles.roomType}>{room.type}</span>
              </div>
            );
          })
        ) : (
          <p>참여하고 있는 채팅방이 없습니다.</p>
        )}
      </div>
      <button onClick={handleGoBack} style={styles.backButton}>
        메인으로
      </button>
    </div>
  );
};

// ... (스타일 객체는 동일)
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  header: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  subHeader: { fontSize: '1.2em', color: '#555', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '30px' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' },
  createButton: { padding: '0 20px', border: 'none', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  roomName: { margin: 0, fontWeight: 'bold', color: '#495057' },
  participantCount: { margin: '4px 0 0 0', fontSize: '12px', color: '#868e96' },
  roomType: { padding: '4px 8px', borderRadius: '12px', backgroundColor: '#e9ecef', fontSize: '12px', color: '#868e96', alignSelf: 'flex-start' },
  backButton: { marginTop: '30px', padding: '10px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '14px' }
};

export default ChatListPage;