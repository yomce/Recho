import React, { useState } from 'react';
import Icon from '@/components/atoms/icon/Icon';

interface MessageInputFormProps {
  onSubmit: (message: string) => void;
}

const MessageInputForm: React.FC<MessageInputFormProps> = ({ onSubmit }) => {
  const [message, setMessage] = useState('');
  const PLACEHOLDER_TEXT = "안녕하세요. 구매 가능할까요?";
  
  const handleFocus = () => {
    if (!message) {
      setMessage(PLACEHOLDER_TEXT);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-20 left-1/2 translate-x-[-50%] w-full max-w-[410px] flex gap-2 z-20"
    >
      {/* 찜 버튼 */}
      <button
        type="button"
        className="text-[#aaaaaa] hover:text-[#ef4444] transition"
      >
        <Icon name="like" size={24} className="w-6 h-6 fill-current" />
      </button>

      {/* 입력창 */}
      <input
        type="text"
        placeholder="안녕하세요. 구매 가능할까요?"
        value={message}
        onFocus={handleFocus}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border border-gray-400 rounded-[10px] px-3 py-1 text-caption focus:outline-none focus:ring focus:border-[#8e4df6]"
      />

      {/* 전송 버튼 */}
      <button
        type="submit"
        className="px-4 py-2 bg-[#8e4df6] text-white text-sm font-medium rounded-[10px] hover:opacity-70"
      >
        전송
      </button>
    </form>
  );
};

export default MessageInputForm;
