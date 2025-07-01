import axios from "axios";
import type { Video } from "../types/video";

const apiClient = axios.create({
  // Vite 프록시 설정을 사용하므로 '/api'를 기본 경로로 설정합니다.
  baseURL: "/api",
});

export const getVideos = async (page = 1, limit = 10): Promise<Video[]> => {
  try {
    const response = await apiClient.get<Video[]>("/videos", {
      params: {
        sortBy: "date", // 'likes' or 'date'
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

export default apiClient;
