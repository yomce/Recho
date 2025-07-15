import type { CONTENT_TYPE, LikePayload } from '@/types/likes';
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
    console.log('videos');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

export const togglePostLike = async (contentType: CONTENT_TYPE, postId: number): Promise<{ liked: boolean; likeCount: number }> => {
  const newLikePayload : LikePayload = {
    contentType: contentType,
    postId: postId
  }
  console.log('payload of like');
  console.log(newLikePayload);

  const response = await axiosInstance.post(`/likes`, newLikePayload);
  return response.data;
};