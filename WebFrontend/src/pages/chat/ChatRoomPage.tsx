// src/pages/ChatRoomPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../../services/axiosInstance';
import { socket } from '../../services/socket';
import { formatToKST } from '../../utils/dateUtils';

// ... 인터페이스 정의는 동일 ...
interface JwtPayload {
  userId: string;
  username: string;
}
interface Message {
  id: string;
  senderId?: string;
  senderName?: string;
  content: string;
  createdAt: string;
  sender?: { username: string };
  isSystem?: boolean;
}

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const [inviteeId, setInviteeId] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- [수정] useEffect 훅 분리 ---

  // 1. 컴포넌트 마운트 시 한 번만 실행되는 효과 (사용자 정보 설정)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decodedToken = jwtDecode<JwtPayload>(token);
      setCurrentUser(decodedToken);
    } else {
      // 토큰이 없으면 로그인 페이지로 이동
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  }, [navigate]); // navigate는 거의 변하지 않으므로 이 훅은 사실상 한 번만 실행됩니다.

  // 2. roomId 또는 currentUser가 성공적으로 설정된 후에 실행되는 효과
  useEffect(() => {
    // currentUser가 아직 설정되지 않았거나 roomId가 없으면 아무 작업도 하지 않음
    if (!currentUser || !roomId) {
      return;
    }

    // 채팅 내역 불러오기
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get(`/chat/rooms/${roomId}/history`);
        const historyWithSenderName = response.data.map((msg: Message) => ({
          ...msg,
          senderName: msg.sender?.username,
        }));
        setMessages(historyWithSenderName);
      } catch (error) {
        console.error('메시지 기록을 불러오는 데 실패했습니다.', error);
      }
    };
    fetchHistory();

    // 소켓 연결 및 이벤트 핸들러 등록
    socket.connect();
    socket.emit('joinRoom', { userId: currentUser.userId, roomId });

    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    const handleUserLeft = (data: { userId: string; username: string }) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${data.username}님이 나가셨습니다.`,
        createdAt: new Date().toISOString(),
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, systemMessage]);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userLeft', handleUserLeft);

    // 컴포넌트가 언마운트될 때 실행될 클린업 함수
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userLeft', handleUserLeft);
      socket.disconnect();
    };
  }, [roomId, currentUser]); // 이 훅은 roomId나 currentUser가 변경될 때만 실행됩니다.

  // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ... 나머지 핸들러 함수(handleSendMessage, handleInviteUser, handleLeaveRoom)와 JSX는 동일 ...
  // (이하 생략)
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !roomId) return;
    socket.emit('sendMessage', {
      roomId,
      senderId: currentUser.userId,
      senderName: currentUser.username,
      content: newMessage,
    });
    setNewMessage('');
  };
  const handleInviteUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteeId.trim() || !roomId) return alert('초대할 유저의 ID를 입력해주세요.');
    socket.emit('inviteUser', { roomId, inviteeId });
    alert(`${inviteeId}님을 초대했습니다.`);
    setInviteeId('');
  };
  const handleLeaveRoom = () => {
    if (!window.confirm('정말로 이 방을 나가시겠습니까?')) return;
    if (!roomId || !currentUser) return;
    socket.emit('leaveRoom', { userId: currentUser.userId, roomId });
    alert('채팅방에서 나갔습니다.');
    navigate('/chat');
  };

  return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/chat')} style={styles.backButton}>← 목록</button>
          <h2 style={styles.roomTitle}>채팅방</h2>
          <form onSubmit={handleInviteUser} style={styles.inviteForm}>
              <input 
                type="text"
                placeholder="초대할 유저 ID"
                value={inviteeId}
                onChange={(e) => setInviteeId(e.target.value)}
                style={styles.inviteInput}
              />
              <button type="submit" style={styles.inviteButton}>초대</button>
          </form>
          <button onClick={handleLeaveRoom} style={styles.leaveButton}>나가기</button>
        </div>
        <div style={styles.chatWindow}>
          {messages.map((msg) => 
            msg.isSystem ? (
              <div key={msg.id} style={styles.systemMessage}>
                {msg.content}
              </div>
            ) : (
              <div
                key={msg.id}
                style={{...styles.messageBubble, alignSelf: msg.senderId === currentUser?.userId ? 'flex-end' : 'flex-start', backgroundColor: msg.senderId === currentUser?.userId ? '#007bff' : '#e9ecef', color: msg.senderId === currentUser?.userId ? 'white' : 'black' }}
              >
                <div style={styles.senderName}>{msg.senderName || msg.sender?.username}</div>
                <p style={styles.messageContent}>{msg.content}</p>
                <span style={styles.timestamp}>{formatToKST(msg.createdAt)}</span>
              </div>
            )
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={styles.input}
          />
          <button type="submit" style={styles.sendButton}>전송</button>
        </form>
      </div>
    );
};
// ... 스타일 객체는 동일 (생략)
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee' },
  header: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #eee', gap: '15px' },
  backButton: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '8px 12px' },
  roomTitle: { margin: 0, flexGrow: 1 },
  inviteForm: { display: 'flex', gap: '5px' },
  inviteInput: { padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
  inviteButton: { padding: '0 15px', border: 'none', borderRadius: '5px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer' },
  leaveButton: { padding: '8px 15px', border: 'none', borderRadius: '5px', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer' },
  chatWindow: { flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  messageBubble: { maxWidth: '70%', padding: '10px 15px', borderRadius: '20px', wordBreak: 'break-word' },
  senderName: { fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 },
  messageContent: { margin: 0, fontSize: '16px' },
  timestamp: { fontSize: '10px', alignSelf: 'flex-end', marginTop: '5px', opacity: 0.6 },
  inputForm: { display: 'flex', padding: '10px', borderTop: '1px solid #eee' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '20px', marginRight: '10px' },
  sendButton: { padding: '12px 20px', border: 'none', borderRadius: '20px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' },
  systemMessage: { alignSelf: 'center', backgroundColor: '#f8f9fa', color: '#6c757d', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', margin: '5px 0' },
};
export default ChatRoomPage;