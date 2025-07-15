import axiosInstance from "../services/axiosInstance";
import type { Video } from "../types/video";

// likes나 createdAt으로 정렬 할 듯
// 무한 스크롤과 간단한 추천 시스템 추가 필요

export const getVideos = async (page = 1, limit = 10): Promise<Video[]> => {
  try {
    const response = await axiosInstance.get<Video[]>('videos', {
      params: {
        sortBy: "createdAt",
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

// --- 추가된 함수 ---
/**
 * ID로 특정 비디오 하나의 정보를 가져옵니다.
 * @param videoId 비디오의 ID
 * @returns 비디오 객체
 */
export const getVideoById = async (videoId: string): Promise<Video> => {
  const response = await axiosInstance.get<Video>(`videos/${videoId}`);
  return response.data;
};