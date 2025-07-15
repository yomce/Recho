// src/components/atoms/input/MessageInput.tsx

import React, { useState } from 'react';
import Icon from '@/components/atoms/icon/Icon';
import TextareaAutosize from 'react-textarea-autosize';

interface MessageInputFormProps {
  onSubmit: (message: string) => void;
  onDmClick?: () => void;
}

const MessageInputForm: React.FC<MessageInputFormProps> = ({ onSubmit, onDmClick }) => {
  const [message, setMessage] = useState('');
  // const PLACEHOLDER_TEXT = "안녕하세요. 구매 가능할까요?";
  
  // const handleFocus = () => {
  //   if (!message) {
  //     setMessage(PLACEHOLDER_TEXT);
  //   }
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-20 left-1/2 translate-x-[-50%] w-full max-w-[410px] flex gap-2 z-20 px-2 mb-0 mt-16"
    >
      {/* 찜 버튼 */}
      <button
        type="button"
        className="text-[#aaaaaa] hover:text-[#ef4444] transition"
      >
        <Icon name="like" size={24} className="w-6 h-6 fill-current" />
      </button>

      {/* 입력창 */}
      <TextareaAutosize
        placeholder="메세지를 입력하세요."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border border-gray-400 rounded-card px-3 py-2 text-caption bg-brand-inverse focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
        minRows={1}
        maxRows={4}
      />

      {/* 전송 버튼 */}
      <button
        type="submit"
        onClick={onDmClick}
        className="flex-shrink-0 rounded-full bg-brand-primary p-3 text-white disabled:bg-brand-disabled"
      >
        <Icon name="send" size={20} />
      </button>
    </form>
  );
};

export default MessageInputForm;
