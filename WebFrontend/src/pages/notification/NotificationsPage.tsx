// src/pages/notification/NotificationsPage.tsx

import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import PostLayout from '@/components/layout/PostLayout'; // 재사용 가능한 레이아웃
import Icon from '@/components/atoms/icon/Icon';

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "년 전";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "달 전";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일 전";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간 전";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분 전";
    return "방금 전";
  };

  const NotificationsPage: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    // 페이지에 들어왔을 때 안 읽은 알림들을 1초 뒤에 자동으로 읽음 처리
    useEffect(() => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length > 0) {
            const timer = setTimeout(() => {
                markAsRead(unreadIds);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [notifications, markAsRead]);

    const getIconName = (type: string) => {
        if (type === 'LIKE') return 'likeFill';
        if (type === 'COMMENT') return 'chat';
        return 'notification';
    };
    
    const getIconColor = (type: string) => {
        if (type === 'LIKE') return 'text-red-500';
        if (type === 'COMMENT') return 'text-blue-500';
        return 'text-brand-gray';
    };


    return (
        <PostLayout>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-headline font-bold">알림</h1>
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="text-sm text-brand-primary font-semibold"
                        >
                            모두 읽음
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {notifications.length === 0 ? (
                        <p className="text-center text-brand-gray p-8">새로운 알림이 없습니다.</p>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-card flex items-center gap-4 cursor-pointer 
                                            ${notification.isRead ? 'bg-brand-frame' : 'bg-brand-default'}`}
                                onClick={() => navigate(notification.link)}
                            >
                                <Icon name={getIconName(notification.type)} size={24} className={getIconColor(notification.type)} />
                                <div className="flex-1">
                                    <p className="text-body text-brand-text-primary">{notification.message}</p>
                                    <p className="text-footnote text-brand-gray">{timeSince(new Date(notification.createdAt))}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PostLayout>
    );
};

export default NotificationsPage;
