// src/pages/ChatListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // + 추가: JWT 토큰을 디코딩하기 위해 import
import axiosInstance from '../../services/axiosInstance';
import { socket } from '../../services/socket';

// + 추가: JWT 페이로드 타입 정의
interface JwtPayload {
  userId: string;
  username: string;
}

interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteeIds, setInviteeIds] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await axiosInstance.get<ChatRoom[]>('/chat/my-rooms'); //
        setRooms(response.data);
      } catch (err) {
        console.error('채팅방 목록을 불러오는 데 실패했습니다.', err);
        setError('채팅방 목록을 불러올 수 없습니다. 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    };
    fetchChatRooms();

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoomName.trim()) return alert('채팅방 이름을 입력해주세요.');

    try {
      const response = await axiosInstance.post<ChatRoom>('/chat/rooms', { //
        name: newRoomName,
        type: 'GROUP', //
      });
      setRooms((prevRooms) => [response.data, ...prevRooms]);
      setNewRoomName('');
      alert(`'${response.data.name}' 방이 생성되었습니다!`);
    } catch (err) {
      console.error('채팅방 생성에 실패했습니다.', err);
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  const handleInviteUser = (roomId: string) => {
    const inviteeId = inviteeIds[roomId];
    if (!inviteeId || !inviteeId.trim()) {
      return alert('초대할 유저의 ID를 입력해주세요.');
    }

    socket.emit('inviteUser', { roomId, inviteeId }); //

    alert(`${inviteeId}님을 초대했습니다.`);
    setInviteeIds(prev => ({ ...prev, [roomId]: '' }));
  };
  
  // + 추가: 채팅방 나가기 함수
  const handleLeaveRoom = (roomId: string, roomName: string | undefined) => {
    if (!window.confirm(`'${roomName || '이 채팅방'}'에서 정말로 나가시겠습니까?`)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const userId = decoded.userId;

      // 백엔드로 'leaveRoom' 이벤트 전송
      socket.emit('leaveRoom', { userId, roomId });

      // 화면에서 즉시 채팅방 제거
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));

      alert('채팅방에서 나갔습니다.');
    } catch (error) {
      console.error('토큰 디코딩 또는 방 나가기 요청에 실패했습니다.', error);
      alert('오류가 발생하여 방을 나갈 수 없습니다.');
    }
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
                <p style={styles.roomName}>{room.name || `개인 채팅`}</p>
                <span style={styles.roomType}>{room.type}</span>
              </div>
              <div style={styles.actionsContainer}> {/* + 추가: 버튼들을 감싸는 컨테이너 */}
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
                {/* + 추가: 나가기 버튼 */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveRoom(room.id, room.name);
                  }} 
                  style={styles.leaveButton}
                >
                  나가기
                </button>
              </div>
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

// + 수정: 스타일 객체에 actionsContainer, leaveButton 추가 및 inviteForm 스타일 조정
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  header: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  subHeader: { fontSize: '1.2em', color: '#555', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '30px' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' },
  createButton: { padding: '0 20px', border: 'none', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '16px' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roomContainer: { backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', transition: 'background-color 0.2s' },
  roomName: { margin: 0, fontWeight: 'bold', color: '#495057' },
  roomType: { padding: '4px 8px', borderRadius: '12px', backgroundColor: '#e9ecef', fontSize: '12px', color: '#868e96' },
  actionsContainer: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #e9ecef', gap: '10px' },
  inviteForm: { display: 'flex', flexGrow: 1, gap: '10px' },
  inviteInput: { flexGrow: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
  inviteButton: { padding: '0 15px', border: 'none', borderRadius: '5px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer' },
  leaveButton: { padding: '8px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' },
  backButton: { marginTop: '30px', padding: '10px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '14px' }
};

export default ChatListPage;