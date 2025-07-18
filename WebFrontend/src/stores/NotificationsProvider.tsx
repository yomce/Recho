// src/stores/NotificationsProvider.tsx

import { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { fetchMyNotifications, markNotificationsAsRead } from '../services/notificationApi';

// --- 타입 정의 ---
interface Notification {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  type: 'LIKE' | 'COMMENT';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});



// --- Provider 컴포넌트 ---
export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useAuthStore((state) => state.user);

  // 새로고침 시 사라지는 문제 해결: 앱 로드 시 서버에서 전체 알림 목록을 가져옵니다.
  useEffect(() => {
    if (!user?.id) return;
    
    const loadInitialNotifications = async () => {
      try {
        const initialNotifs = await fetchMyNotifications();
        setNotifications(initialNotifs);
      } catch (error) {
        console.error("알림 목록 초기 로딩 실패:", error);
      }
    };
    loadInitialNotifications();
  }, [user]);

  // 실시간으로 새 알림을 받는 로직
  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = io(`${import.meta.env.VITE_API_URL}/notifications`);

    socket.on('connect', () => {
      socket.emit('register', user.id);
    });

    socket.on('newNotification', (newNotification: Notification) => {
      // 기존 목록의 맨 앞에 새 알림을 추가합니다.
      setNotifications(prev => [newNotification, ...prev]);
    });
    
    return () => { socket.disconnect(); };
  }, [user]);

  // 읽음 처리 및 카운트 문제 해결: 상태 업데이트 함수들
  const markAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    // UI를 먼저 업데이트하여 사용자 경험을 개선합니다 (Optimistic Update)
    setNotifications(prev => 
      prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
    );
    try {
      await markNotificationsAsRead(ids);
    } catch (error) {
      console.error("알림 읽음 처리 API 호출 실패:", error);
      // 필요하다면 여기서 UI를 원래대로 되돌리는 로직을 추가할 수 있습니다.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // 안 읽은 알림이 있을 때만 실행
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markNotificationsAsRead(); // 백엔드 API는 ID 없이 호출 시 '전체 읽음'으로 처리
    } catch (error) {
      console.error("전체 알림 읽음 처리 API 호출 실패:", error);
    }
  }, [notifications]);

  // 안 읽은 알림 개수는 항상 notifications 배열을 기반으로 계산됩니다.
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = { notifications, unreadCount, markAsRead, markAllAsRead };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};