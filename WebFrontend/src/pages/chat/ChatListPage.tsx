// src/pages/ChatListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { socket } from '../../services/socket';

interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
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

    // 웹소켓 연결은 다른 페이지와의 실시간 동기화를 위해 유지할 수 있습니다.
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoomName.trim()) return alert('채팅방 이름을 입력해주세요.');

    try {
      const response = await axiosInstance.post<ChatRoom>('/chat/rooms', {
        name: newRoomName,
        type: 'GROUP',
      });
      setRooms((prevRooms) => [response.data, ...prevRooms]);
      setNewRoomName('');
      alert(`'${response.data.name}' 방이 생성되었습니다!`);
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

  if (loading) return <div style={styles.container}><h2>로딩 중...</h2></div>;
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
        <button type="submit" style={styles.createButton}>만들기</button>
      </form>
      <h2 style={styles.subHeader}>채팅방 목록</h2>
      <div style={styles.roomList}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            // 이제 roomContainer는 클릭 이벤트만 가집니다.
            <div key={room.id} style={styles.roomItem} onClick={() => handleEnterRoom(room.id)}>
                <p style={styles.roomName}>{room.name || `개인 채팅`}</p>
                <span style={styles.roomType}>{room.type}</span>
            </div>
          ))
        ) : (
          <p>참여하고 있는 채팅방이 없습니다.</p>
        )}
      </div>
      <button onClick={handleGoBack} style={styles.backButton}>메인으로</button>
    </div>
  );
};

// 스타일 객체 (간소화)
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  header: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  subHeader: { fontSize: '1.2em', color: '#555', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '30px' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' },
  createButton: { padding: '0 20px', border: 'none', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  roomName: { margin: 0, fontWeight: 'bold', color: '#495057' },
  roomType: { padding: '4px 8px', borderRadius: '12px', backgroundColor: '#e9ecef', fontSize: '12px', color: '#868e96' },
  backButton: { marginTop: '30px', padding: '10px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '14px' }
};

export default ChatListPage;