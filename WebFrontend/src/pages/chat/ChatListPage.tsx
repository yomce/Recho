// src/pages/ChatListPage.tsx (수정된 최종본)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { useAuthStore } from "../../stores/authStore";

// 공통 컴포넌트를 import 합니다.
import PostLayout from "@/components/layout/PostLayout";
import Avatar from "@/components/atoms/avatar/Avatar";
import Icon from "@/components/atoms/icon/Icon";
import SearchOverlay from "@/components/organisms/SearchOverlay";
import { DEFAULT_IMAGES } from "@/constants/images";

// --- 타입 정의 ---
interface ChatUser {
  id: string;
  username: string;
  profileUrl?: string | null;
}
interface UserRoom {
  user: ChatUser;
}
interface ChatRoom {
  id: string;
  name?: string;
  type: "PRIVATE" | "GROUP";
  userRooms: UserRoom[];
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchChatRooms = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<ChatRoom[]>("chat/my-rooms");
        setRooms(response.data);
      } catch (err) {
        console.error("채팅방 목록을 불러오는 데 실패했습니다.", err);
        setError("채팅방 목록을 불러올 수 없습니다. 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };
    fetchChatRooms();
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoomName.trim()) return alert("채팅방 이름을 입력해주세요.");
    try {
      const response = await axiosInstance.post<ChatRoom>("/chat/rooms", {
        name: newRoomName,
        type: "GROUP",
      });
      setNewRoomName("");
      alert(`'${response.data.name}' 방이 생성되었습니다!`);
      const roomsResponse =
        await axiosInstance.get<ChatRoom[]>("chat/my-rooms");
      setRooms(roomsResponse.data);
    } catch (err) {
      alert("채팅방 생성에 실패했습니다.");
    }
  };
  const handleEnterRoom = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  if (loading)
    return (
      <PostLayout>
        <div className="p-4 text-center">
          채팅방 정보를 불러오고 있습니다...
        </div>
      </PostLayout>
    );
  if (error)
    return (
      <PostLayout>
        <div className="p-4 text-center text-brand-error-text">
          에러: {error}
        </div>
      </PostLayout>
    );

  return (
    // PostLayout을 사용하고, 배경색을 흰색으로 지정합니다.
    <PostLayout
      bgClassName="bg-brand-frame"
      onSearchClick={() => setIsSearchOverlayOpen(true)}
    >
      <div className="p-4">
        {/* 그룹 채팅방 생성 폼 */}
        <form onSubmit={handleCreateRoom} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="새 그룹 채팅방 이름"
            className="flex-3 px-4 py-2 rounded-card text-body bg-brand-default focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          <button
            type="submit"
            className="flex-1 max-w-[60px] whitespace-nowrap overflow-hidden px-4 py-2 text-white rounded-card bg-brand-primary text-button hover:opacity-90"
          >
            <Icon name="plus" size={20} className="inline-block mb-1" />
          </button>
        </form>

        {/* 채팅방 목록 */}
        <div className="space-y-3">
          {rooms.length > 0 ? (
            rooms.map((room) => {
              const isPrivate = room.type === "PRIVATE";
              const participants = room.userRooms?.map((ur) => ur.user) || [];
              const chatPartner = isPrivate
                ? participants.find((p) => p.id !== user?.id)
                : null;

              const roomName = isPrivate
                ? chatPartner?.username || "알 수 없는 사용자"
                : room.name;
              const avatarAlt = isPrivate
                ? chatPartner?.username || "?"
                : room.name?.charAt(0) || "G";

              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 transition-colors rounded-card bg-brand-default hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleEnterRoom(room.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* 아바타 표시 */}
                    {isPrivate ? (
                      <Avatar
                        src={
                          chatPartner?.profileUrl ||
                          DEFAULT_IMAGES.PROFILE
                        }
                        alt={avatarAlt}
                        size={48}
                      />
                    ) : (
                      <div className="relative flex w-12 h-12">
                        {participants.slice(0, 2).map((p, index) => (
                          <div
                            key={p.id}
                            className={`absolute ${index === 0 ? "top-0 left-0 z-10" : "bottom-0 right-0"}`}
                          >
                            <Avatar
                              src={
                                p.profileUrl ||
                                DEFAULT_IMAGES.PROFILE
                              }
                              alt={p.username}
                              size={32}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 채팅방 이름 및 정보 */}
                    <div>
                      <p className="text-caption-bold text-brand-text-primary">
                        {roomName}
                      </p>
                      {!isPrivate && (
                        <p className="text-footnote text-brand-gray">
                          {participants.length}명 참여중
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-brand-gray">
              <p>참여하고 있는 채팅방이 없습니다.</p>
              <p className="text-footnote">
                새로운 그룹 채팅방을 만들어보세요!
              </p>
            </div>
          )}
        </div>
      </div>
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
      />
    </PostLayout>
  );
};

export default ChatListPage;
