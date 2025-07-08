// src/pages/chat/ChatRoomPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useMotionValue } from "framer-motion";
// Zustand 스토어 임포트
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";
import type { Message } from "../../stores/chatStore";
// 컴포넌트 임포트
import MessageBubble from "@/components/molecules/MessageBubble";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import TextInput from "@/components/atoms/input/TextInput";
import MessageInput from "@/components/molecules/MessageInput";
import Modal from "@/components/molecules/modal/Modal";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // --- 스토어에서 상태와 액션 가져오기 ---
  const { user } = useAuthStore();
  const id = user?.id;

  const {
    isConnected,
    messages,
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

  // --- 컴포넌트 생명주기와 스토어 액션 연결 ---
  // ❗️ useEffect 의존성 배열을 수정합니다.
  useEffect(() => {
    // 소켓이 연결되지 않았거나, 유저 또는 roomId 정보가 없으면 실행하지 않고 기다립니다.
    if (!isConnected || !user || !roomId) {
      return;
    }
    
    // 모든 조건이 만족되면 방 초기화 함수를 호출합니다.
    initializeRoom(roomId);

    return () => {
      cleanupRoom();
    };
    // ❗️ 여기에 isConnected를 추가하는 것이 핵심입니다!
  }, [isConnected, roomId, user, initializeRoom, cleanupRoom]);

  // 메시지 목록이 변경될 때마다 맨 아래로 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        className="flex-1 p-4 overflow-y-auto bg-brand-frame"
        style={{ x: dragX }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
      >
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
                    <MessageBubble msg={msg} currentUserId={id} dragX={dragX} />
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
                        msg={msg}
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