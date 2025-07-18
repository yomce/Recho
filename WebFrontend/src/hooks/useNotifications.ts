// src/hooks/useNotifications.ts

import { useContext } from 'react';
import { NotificationContext } from '@/stores/NotificationsProvider'; // 경로에 주의하세요.

export const useNotifications = () => {
  return useContext(NotificationContext);
};