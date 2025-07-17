import type { CONTENT_TYPE, LikePayload } from '@/types/likes';
import axiosInstance from "../services/axiosInstance";
import type { Video } from "../types/video";
import type { Promotion } from '@/types/promotion';
import axios from 'axios';

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
    console.log("video response");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

/**
 * ID로 특정 비디오 하나의 정보를 가져옵니다.
 * @param videoId 비디오의 ID
 * @returns 비디오 객체
 */
export const getVideoById = async (videoId: string): Promise<Video> => {
  const response = await axiosInstance.get<Video>(`videos/${videoId}`);
  console.log('get video by id');
  console.log(response.data);
  return response.data;
};

export const toggleNumberPostLike = async (contentType: CONTENT_TYPE, postId: number): Promise<{ liked: boolean; likeCount: number }> => {
  const newLikePayload : LikePayload = {
    contentType: contentType,
    postId: postId
  }

  const response = await axiosInstance.post(`/likes`, newLikePayload);
  return response.data;
};

export const toggleStringPostLike = async (contentType: CONTENT_TYPE, postId: string): Promise<{ liked: boolean; likeCount: number }> => {
  const newLikePayload : LikePayload = {
    contentType: contentType,
    postId: postId
  }

  const response = await axiosInstance.post(`/likes`, newLikePayload);
  return response.data;
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await axiosInstance.get<Promotion[]>(`promotions`);
    // axios는 응답 데이터를 data 속성에 담아 반환합니다.
    return response.data;
  } catch (error) {
    // 에러를 콘솔에 출력하고, 호출한 쪽에서 처리할 수 있도록 다시 던집니다.
    console.error('프로모션 정보를 불러오는데 실패했습니다:', error);
    throw error;
  }
};

export const postPromotionByUrl = async (url: string): Promise<Promotion> => {
  try {
    const response = await axiosInstance.post<Promotion>(`scraping/promotion`, { url });
    return response.data;
  } catch (error) {
    console.error('프로모션 추가에 실패했습니다:', error);
    // axios 에러 객체에서 서버가 보낸 메시지를 사용하는 것이 더 좋습니다.
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '서버 요청에 실패했습니다.');
    }
    throw error;
  }
};