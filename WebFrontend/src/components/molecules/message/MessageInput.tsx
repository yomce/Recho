// src/components/molecules/message/MessageInput.tsx

import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  placeholder = '메시지를 입력하세요...',
  onKeyDown,
}) => {
  return (
    <TextareaAutosize
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full resize-none rounded-2xl border border-gray-300 bg-gray-100 px-4 py-2 text-body focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      minRows={1} // 최소 높이 (한 줄)
      maxRows={5} // 최대 높이 (다섯 줄). 이 이상은 스크롤됩니다.
      autoComplete="off"
    />
  );
};

export default MessageInput;