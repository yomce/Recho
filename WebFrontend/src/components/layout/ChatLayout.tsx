// src/components/layout/ChatLayout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '../atoms/button/IconButton';
import Avatar from '../atoms/avatar/Avatar';
import MessageInput from '../molecules/message/MessageInput';
import Icon from '../atoms/icon/Icon';

// ChatLayout이 받을 props 타입 정의
interface ChatLayoutProps {
  children: React.ReactNode;
  chatPartner: { id?: string; username?: string; profileUrl?: string };
  newMessage: string;
  onNewMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInvite: () => void;
  onLeave: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  chatPartner,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onKeyDown,
  onInvite,
  onLeave,
}) => {
  const navigate = useNavigate();

  const goToUserProfile = () => {
    if (chatPartner.id) navigate(`/users/${chatPartner.id}`);
  };

  return (
    <div className="flex h-screen w-full max-w-[430px] mx-auto flex-col bg-brand-default">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b border-gray-200 p-4">
        <IconButton iconName="back" onClick={() => navigate('/chat')} />
        <button
          onClick={goToUserProfile}
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
          disabled={!chatPartner.id}
        >
          <Avatar src={chatPartner.profileUrl || `https://placehold.co/32x32/e9ecef/495057?text=${chatPartner.username?.charAt(0)}`} alt={chatPartner.username} size={32} />
          <h2 className="text-subheadline text-brand-text-primary">{chatPartner.username}</h2>
        </button>
        <div className="flex items-center">
          <IconButton iconName="addUser" iconSize={22} onClick={onInvite} />
          <IconButton iconName="exit" onClick={onLeave} className="hover:!text-brand-error-text" />
        </div>
      </header>

      {/* 채팅 메시지 목록 (children으로 렌더링) */}
      <main className="flex-1 overflow-y-auto bg-brand-frame">{children}</main>

      {/* 푸터 (메시지 입력창) */}
      <footer className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-3">
          <MessageInput value={newMessage} onChange={onNewMessageChange} onKeyDown={onKeyDown} />
          <button
            onClick={onSendMessage}
            className="flex-shrink-0 rounded-full bg-brand-primary p-3 text-white disabled:bg-brand-disabled"
            disabled={!newMessage.trim()}
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatLayout;