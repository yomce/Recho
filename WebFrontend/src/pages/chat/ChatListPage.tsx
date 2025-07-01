// src/pages/ChatListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance'; // API 클라이언트 import
import { socket } from '../../services/socket'; // 웹소켓 클라이언트 import

// 채팅방 데이터의 타입을 정의합니다.
interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteeIds, setInviteeIds] = useState<{ [key: string]: string }>({}); // 초대할 ID를 관리하는 state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 채팅방 목록을 불러옵니다.
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

    // 웹소켓 서버에 연결합니다.
    socket.connect();

    // 컴포넌트가 언마운트될 때 웹소켓 연결을 해제합니다.
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

  /**
   * 다른 사용자를 채팅방에 초대하는 함수
   */
  const handleInviteUser = (roomId: string) => {
    const inviteeId = inviteeIds[roomId];
    if (!inviteeId || !inviteeId.trim()) {
      return alert('초대할 유저의 ID를 입력해주세요.');
    }

    // 'inviteUser' 이벤트를 서버로 보냅니다.
    socket.emit('inviteUser', { roomId, inviteeId });

    alert(`${inviteeId}님을 초대했습니다.`);
    // 초대 후 입력 필드를 비웁니다.
    setInviteeIds(prev => ({ ...prev, [roomId]: '' }));
  };

  const handleInviteInputChange = (roomId: string, value: string) => {
    setInviteeIds(prev => ({ ...prev, [roomId]: value }));
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
            <div key={room.id} style={styles.roomContainer}>
              <div style={styles.roomItem} onClick={() => handleEnterRoom(room.id)}>
                <p style={styles.roomName}>{room.name || `개인 채팅 (${room.id.substring(0, 6)})`}</p>
                <span style={styles.roomType}>{room.type}</span>
              </div>
              {/* 그룹 채팅방에만 초대 폼을 보여줍니다. */}
              {room.type === 'GROUP' && (
                <form
                  style={styles.inviteForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInviteUser(room.id);
                  }}
                >
                  <input
                    type="text"
                    placeholder="초대할 유저 ID"
                    value={inviteeIds[room.id] || ''}
                    onChange={(e) => handleInviteInputChange(room.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={styles.inviteInput}
                  />
                  <button type="submit" style={styles.inviteButton}>초대</button>
                </form>
              )}
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

// 스타일 객체
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  header: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  subHeader: { fontSize: '1.2em', color: '#555', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '30px' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' },
  createButton: { padding: '0 20px', border: 'none', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roomContainer: { backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', cursor: 'pointer', transition: 'background-color 0.2s' },
  roomName: { margin: 0, fontWeight: 'bold', color: '#495057' },
  roomType: { padding: '4px 8px', borderRadius: '12px', backgroundColor: '#e9ecef', fontSize: '12px', color: '#868e96' },
  inviteForm: { display: 'flex', gap: '10px', padding: '0 20px 15px 20px', borderTop: '1px solid #e9ecef' },
  inviteInput: { flexGrow: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
  inviteButton: { padding: '0 15px', border: 'none', borderRadius: '5px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer' },
  backButton: { marginTop: '30px', padding: '10px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '14px' }
};

export default ChatListPage;
