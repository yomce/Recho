import axios from 'axios';
import { type Post, type CreatePostData } from '../types/post'; 

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});

/** 모든 게시물을 불러옵니다. */
export const fetchPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get('/posts');
  return response.data;
};

/** ⭐️ 새 게시물을 생성하는 함수 추가 */
export const createPost = async (newPostData: CreatePostData): Promise<Post> => {
  const response = await apiClient.post('/posts', newPostData);
  return response.data;
}

// ... (fetchPostById 등)