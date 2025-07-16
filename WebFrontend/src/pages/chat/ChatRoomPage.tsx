// WebFrontend/src/pages/chat/ChatRoomPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useMotionValue } from "framer-motion";
// Zustand 스토어 임포트
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";
import type { Message } from "../../stores/chatStore";
// 컴포넌트 임포트
import MessageBubble from "@/components/molecules/message/MessageBubble";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import TextInput from "@/components/atoms/input/TextInput";
import MessageInput from "@/components/molecules/message/MessageInput";
import Modal from "@/components/molecules/modal/Modal";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";
import { IoChevronDown } from 'react-icons/io5';
// Axios 인스턴스 import
import axiosInstance from "../../services/axiosInstance";

// 시간 포맷팅을 위한 간단한 헬퍼 함수 (컴포넌트 외부에 추가)
const formatTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // --- 스토어에서 상태와 액션 가져오기 ---
  const { user } = useAuthStore();
  const id = user?.id;

  const {
    isConnected,
    messages,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    chatPartner,
    isModalOpen,
    modalType,
    initializeRoom,
    cleanupRoom,
    sendMessage,
    inviteUser,
    leaveCurrentRoom,
    openModal,
    closeModal,
  } = useChatStore();

  const goToUserProfile = () => {
    if (chatPartner.id) {
      navigate(`/users/${chatPartner.id}`);
    }
  };

  // --- 컴포넌트 로컬 상태 ---
  const [newMessage, setNewMessage] = useState("");
  const [inviteeId, setInviteeId] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); 
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    // 스크롤이 맨 위로 올라갔고, 로딩 중이 아니며, 더 불러올 메시지가 있을 때
    if(container){
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 100;
      setShowScrollToBottom(isScrolledUp); // 상태 업데이트

      if (container && container.scrollTop === 0 && !isLoadingMore && hasMore) {
      // 이전 스크롤 높이를 기록
      const prevScrollHeight = container.scrollHeight;
      
      loadMoreMessages().then(() => {
        // 비동기 로딩 후 스크롤 위치 조정
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
      }
    }
  };
  // --- 컴포넌트 생명주기와 스토어 액션 연결 ---
  useEffect(() => {
    // 필수 정보가 없으면 실행을 중단합니다.
    if (!roomId || !user) {
      return;
    }

    // ✅ 접근 권한 확인 및 방 초기화를 위한 비동기 함수
    const validateAndInitialize = async () => {
      try {
        // 1. 백엔드 API를 호출하여 현재 유저가 이 채팅방에 접근할 권한이 있는지 확인합니다.
        await axiosInstance.get(`/chat/rooms/${roomId}`);

        // 2. 권한 확인이 성공하면, 소켓 연결 상태를 확인하고 방 초기화를 진행합니다.
        if (isConnected) {
          initializeRoom(roomId);
        }
      } catch (error) {
        // 3. 권한이 없거나 방이 존재하지 않으면 에러가 발생합니다.
        console.error("접근 권한이 없거나 존재하지 않는 채팅방입니다.", error);
        alert("접근할 수 없는 채팅방입니다.");
        navigate("/main"); // 사용자를 메인 페이지로 리다이렉트합니다.
      }
    };

    // 위에서 정의한 비동기 함수를 호출합니다.
    validateAndInitialize();

    // 컴포넌트가 사라질 때 채팅 관련 리소스를 정리하는 cleanup 함수를 반환합니다.
    return () => {
      cleanupRoom();
    };
  }, [roomId, user, isConnected, navigate, initializeRoom, cleanupRoom]); // 의존성 배열에 navigate 추가

  // 메시지 목록이 변경될 때마다 맨 아래로 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoadingMore) { // 추가 로딩 시에는 맨 아래로 가지 않도록 함
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoadingMore]);

  // --- 핸들러 함수들 ---
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const confirmLeaveRoom = () => {
    leaveCurrentRoom();
    navigate("/chat");
  };

  const confirmInviteUser = () => {
    inviteUser(inviteeId);
    setInviteeId("");
  };

  // 로딩 상태를 더 명확하게 표시
  if (!isConnected || !user) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-default">
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* 헤더 UI는 유지하되, 내용은 로딩 상태로 표시 */}
          <h2 className="text-subheadline text-brand-text-primary">
            연결 중...
          </h2>
        </header>
        <main className="flex-1 p-4 overflow-y-auto flex justify-center items-center">
          <p>채팅방 정보를 불러오고 있습니다...</p>
        </main>
      </div>
    );
  }

  // --- JSX (UI 렌더링) ---
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-default">
      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigate("/chat")}
          className="p-2 text-brand-gray hover:text-brand-primary"
        >
          <Icon name="back" />
        </button>
        <button
          onClick={goToUserProfile}
          className="flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-100"
          disabled={!chatPartner.id}
        >
          <Avatar
            src={
              chatPartner.profileUrl ||
              `https://placehold.co/32x32/e9ecef/495057?text=${chatPartner.username?.charAt(
                0
              )}`
            }
            alt={chatPartner.username}
            size={32}
          />
          <h2 className="text-subheadline text-brand-text-primary">
            {chatPartner.username}
          </h2>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal("invite")}
            className="p-2 text-brand-gray hover:text-brand-primary"
          >
            <Icon name="addUser" size={22} />
          </button>
          <button
            onClick={() => openModal("leave")}
            className="p-2 text-brand-gray hover:text-brand-error-text"
          >
            <Icon name="exit" />
          </button>
        </div>
      </header>
      {/* 채팅 메시지 목록 */}
      <motion.main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto bg-brand-frame"
        style={{ x: dragX }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
      >
        {isLoadingMore && (
          <div className="text-center p-2 text-brand-gray">
            이전 메시지를 불러오는 중...
          </div>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((msg: Message) =>
            msg.isSystem ? (
              <div
                key={msg.id}
                className="self-center px-3 py-1 text-xs text-brand-gray bg-gray-200 rounded-full"
              >
                {msg.content}
              </div>
            ) : (
              <div key={msg.id}>
                {msg.senderId === id ? (
                  // 내가 보낸 메시지
                  <div className="flex w-full justify-end">
                    <MessageBubble
                      msg={{ ...msg, time: formatTime(msg.createdAt) }}
                      currentUserId={id}
                      dragX={dragX}
                    />
                  </div>
                ) : (
                  // 상대방이 보낸 메시지
                  <div className="flex items-end gap-2">
                    <Avatar
                      src={
                        msg.sender?.profileUrl ||
                        `https://placehold.co/32x32/e9ecef/495057?text=${msg.sender?.username.charAt(
                          0
                        )}`
                      }
                      alt={msg.sender?.username}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-brand-gray mb-1 text-left block">
                        {msg.sender?.username}
                      </span>
                      <MessageBubble
                        msg={{ ...msg, time: formatTime(msg.createdAt) }}
                        currentUserId={id}
                        dragX={dragX}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div ref={chatEndRef} />
        {showScrollToBottom && (
          <button
            onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-5 right-5 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 focus:outline-none"
            aria-label="Scroll to bottom"
          >
            <IoChevronDown size={20} />
          </button>
        )}
      </motion.main>
      {/* 푸터 */}
      <footer className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          <MessageInput
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSendMessage}
            className="flex-shrink-0 p-3 text-white rounded-full bg-brand-primary disabled:bg-brand-disabled"
            disabled={!newMessage.trim()}
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </footer>

      {/* 모달 렌더링 */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalType === "leave" ? "채팅방 나가기" : "사용자 초대"}
        >
          {modalType === "leave" ? (
            <>
              <p className="mb-6">정말로 이 방을 나가시겠습니까?</p>
              <div className="flex justify-end gap-3">
                <SecondaryButton onClick={closeModal}>취소</SecondaryButton>
                <PrimaryButton
                  onClick={confirmLeaveRoom}
                  className="!w-auto !bg-red-500"
                >
                  나가기
                </PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4">초대할 사용자의 ID를 입력하세요.</p>
              <TextInput
                type="text"
                placeholder="사용자 ID"
                value={inviteeId}
                onChange={(e) => setInviteeId(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <SecondaryButton onClick={closeModal}>취소</SecondaryButton>
                <PrimaryButton onClick={confirmInviteUser} className="!w-auto">
                  초대하기
                </PrimaryButton>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ChatRoomPage;