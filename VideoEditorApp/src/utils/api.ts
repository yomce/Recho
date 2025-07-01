import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // 백엔드 서버 주소

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface PresignedUrlRequest {
  fileType: string;
}

interface PresignedUrlResponse {
  key: string;
  url: string;
}

interface SaveVideoMetaRequest {
  user_id: number;
  video_key: string;
  thumbnail_key: string;
  parent_video_id?: number;
  depth?: number;
}

interface VideoData {
  video_id: number;
  user_id: number;
  parent_video_id: number | null;
  depth: number;
  video_key: string; // Presigned URL
  thumbnail_key: string; // Presigned URL
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface FileInfo {
  fileType: string;
}

interface PresignedUrlInfo {
  uploadUrl: string;
  videoKey: string;
  thumbnailKey: string;
}

interface UploadUrlsResponse {
  videoUploadInfo: PresignedUrlInfo;
  thumbnailUploadInfo: PresignedUrlInfo;
}

interface SaveVideoMetaDto {
  video_key: string;
  thumbnail_key: string;
  parent_video_id?: number;
  depth?: number;
}

export const getUploadUrls = async (
  files: FileInfo[],
): Promise<UploadUrlsResponse> => {
  const { data } = await api.post<UploadUrlsResponse>(
    '/video-insert/upload-urls',
    { files },
  );
  return data;
};

export const saveFinalVideoMeta = async (
  metaData: SaveVideoMetaDto,
): Promise<void> => {
  await api.post('/video-insert/complete', metaData);
};

export const getSourceVideoUrl = async (videoId: number): Promise<string> => {
  const { data } = await api.get<{ presignedUrl: string }>(
    `/videos/source?videoId=${videoId}`,
  );
  return data.presignedUrl;
};

export const getThumbnailsByUser = async (
  userId: number,
): Promise<string[]> => {
  const response = await api.get<string[]>(
    `/videos/thumbnails?userId=${userId}`,
  );
  return response.data;
};

export const getVideos = async (
  sortBy: string,
  limit: number,
  page: number,
): Promise<VideoData[]> => {
  const response = await api.get<VideoData[]>(
    `/videos?sortBy=${sortBy}&limit=${limit}&page=${page}`,
  );
  return response.data;
};

export default api;
