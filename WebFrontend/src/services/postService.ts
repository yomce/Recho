import axios from 'axios';
import { type Post, type CreatePostData } from '../types/post'; 
import axiosInstance from './axiosInstance'; // ⭐️ 인증 인스턴스 임포트

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});



/** * 게시물을 불러옵니다. 카테고리 필터링을 지원합니다.
 * @param category - 조회할 카테고리. '전체' 또는 특정 카테고리 이름.
 */
export const fetchPosts = async (category: string): Promise<Post[]> => {
  // ⭐️ API 요청 시 params 옵션으로 쿼리 파라미터를 전달합니다.
  const response = await apiClient.get('/api/posts', {
    params: {
      category: category,
    },
  });
  return response.data;
};

/** ⭐️ 새 게시물을 생성하는 함수 추가 */
export const createPost = async (newPostData: CreatePostData): Promise<Post> => {
  // ⭐️ 인증이 필요한 요청이므로 axiosInstance를 사용합니다.
  const response = await axiosInstance.post('/posts', newPostData);
  return response.data;
};

// ... (fetchPostById 등)