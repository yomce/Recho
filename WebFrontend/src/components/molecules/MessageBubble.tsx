// src/components/molecules/MessageBubble.tsx

import React from 'react';
import { motion,  useTransform, MotionValue } from 'framer-motion';
import { formatToKST } from '../../utils/dateUtils'; // 경로 확인 필요

// 컴포넌트가 받을 props 타입
interface MessageBubbleProps {
  msg: {
    content: string;
    createdAt: string;
    senderId?: number;
  };
  currentid?: number | null;
  dragX: MotionValue<number>;   
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, currentid, dragX }) => {
  const isMyMessage = msg.senderId === currentid;


  const timestampOpacity = useTransform(
    dragX, // 부모에게서 받은 dragX 사용
    [-80, -10], // 왼쪽으로 -10px 드래그 시작 시 나타나서 -80px에서 완전히 보임
    [1, 0] // 투명도 0 -> 1
  );


  return (
    <div className={`flex items-end gap-2 ${isMyMessage ? 'self-end' : 'self-start'}`}>
      {/* 내가 보낸 메시지일 경우, 시간 먼저 표시 */}
      {isMyMessage && (
        <motion.span style={{ opacity: timestampOpacity }} className="text-xs text-gray-400 whitespace-nowrap">
          {formatToKST(msg.createdAt)}
        </motion.span>
      )}

      {/* props를 여기에 직접 적용 */}
      <motion.div
        initial={{ x: 20, y: 20, transform: "rotate(10deg) scale(0.6)" }}
        animate={{ x: 0, y: 0, transform: "rotate(0deg) scale(1)" }}
        transition={{ type: "spring", stiffness: 1000, damping: 30, duration: 0.3 }}
        style={{
          transformOrigin: isMyMessage ? "right bottom" : "left bottom"
        }}
        
        className={`px-4 py-2 mt-1 rounded-3xl max-w-xs md:max-w-md ${
          isMyMessage
            ? 'bg-brand-primary text-brand-inverse rounded-br-lg'
            : 'bg-white text-brand-text-primary rounded-bl-lg'
        }`}
      >
        <p className="text-body text-left break-words whitespace-pre-line break-all">{msg.content}</p>
      </motion.div>

      {/* 상대방 메시지일 경우, 시간 나중에 표시 */}
      {!isMyMessage && (
        <motion.span style={{ opacity: timestampOpacity }} className="text-xs text-gray-400 whitespace-nowrap">
          {formatToKST(msg.createdAt)}
        </motion.span>
      )}
    </div>
  );
};

export default MessageBubble;
