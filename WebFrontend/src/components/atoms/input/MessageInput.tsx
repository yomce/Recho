// src/components/atoms/input/MessageInput.tsx

import React, { useState, useRef } from "react";
import IconButton from "@/components/atoms/button/IconButton";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/atoms/icon/Icon";

interface MessageInputFormProps {
  onSubmit: (message: string) => void;
  onDmClick?: () => void;
  msgPlaceholder?: string;
}

const MessageInputForm: React.FC<MessageInputFormProps> = ({
  onSubmit,
  onDmClick,
  msgPlaceholder,
}) => {
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 등 조합형 문자 입력 시에는 Enter를 눌러도 바로 전송되지 않도록 합니다.
    if (e.nativeEvent.isComposing) return;

    // Shift 키 없이 Enter만 눌렀을 때
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 기본 동작(줄바꿈)을 막습니다.
      formRef.current?.requestSubmit(); // form의 submit을 프로그래밍적으로 호출합니다.
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="fixed bottom-20 left-1/2 translate-x-[-50%] w-full max-w-[410px] flex gap-2 z-20 px-2 mb-0 mt-16"
    >
      {/* 찜 버튼 */}
      <IconButton
        iconName="like"
        iconSecondName="likeFill"
        iconSecondColor="text-[#ef4444]"
        iconSize={24}
        className="text-[#aaaaaa] hover:text-[#ef4444] transition"
      />

      {/* 입력창 */}
      <TextareaAutosize
        placeholder={msgPlaceholder || "댓글을 입력하세요."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border border-gray-400 rounded-card px-3 py-2 text-caption bg-brand-inverse focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
        minRows={1}
        maxRows={4}
      />

      {/* 전송 버튼 */}
      <button
        type="submit"
        onClick={onDmClick}
        className="flex-shrink-0 rounded-full bg-brand-primary px-4 py-2 text-white disabled:bg-brand-disabled "
      >
        <Icon name="send" size={20} />
      </button>
    </form>
  );
};

export default MessageInputForm;
