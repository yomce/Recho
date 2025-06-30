// src/pages/ChatRoomPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../../services/axiosInstance';
import { socket } from '../../services/socket';

// JWT 페이로드 타입
interface JwtPayload {
  userId: string;
  username: string;
}

// 메시지 데이터 타입
interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  sender?: { username:string };
}

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decodedToken = jwtDecode<JwtPayload>(token);
      setCurrentUser(decodedToken);
    } else {
      navigate('/login');
      return;
    }

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

    socket.connect();
    if (token && roomId) {
        const decoded = jwtDecode<JwtPayload>(token);
        socket.emit('joinRoom', { userId: decoded.userId, roomId });
    }

    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    socket.on('newMessage', handleNewMessage);

    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/chat')} style={styles.backButton}>←</button>
        <h2>채팅방</h2>
      </div>
      <div style={styles.chatWindow}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.senderId === currentUser?.userId ? 'flex-end' : 'flex-start',
              backgroundColor: msg.senderId === currentUser?.userId ? '#007bff' : '#e9ecef',
              color: msg.senderId === currentUser?.userId ? 'white' : 'black',
            }}
          >
            <div style={styles.senderName}>{msg.senderName || msg.sender?.username}</div>
            <p style={styles.messageContent}>{msg.content}</p>
            <span style={styles.timestamp}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
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

// 스타일 객체 (이전과 동일)
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee' },
  header: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #eee' },
  backButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' },
  chatWindow: { flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  messageBubble: { maxWidth: '70%', padding: '10px 15px', borderRadius: '20px', wordBreak: 'break-word' },
  senderName: { fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 },
  messageContent: { margin: 0, fontSize: '16px' },
  timestamp: { fontSize: '10px', alignSelf: 'flex-end', marginTop: '5px', opacity: 0.6 },
  inputForm: { display: 'flex', padding: '10px', borderTop: '1px solid #eee' },
  input: { flexGrow: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '20px', marginRight: '10px' },
  sendButton: { padding: '12px 20px', border: 'none', borderRadius: '20px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' },
};

export default ChatRoomPage;
