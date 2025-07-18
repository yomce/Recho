// src/services/notificationApi.ts

import axiosInstance from './axiosInstance';

// 내 알림 목록 가져오기
export const fetchMyNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};

// 알림 읽음 처리하기 (ID가 없으면 전체 읽음 처리)
export const markNotificationsAsRead = async (notificationIds?: string[]) => {
  await axiosInstance.patch('/notifications/read', { notificationIds });
};