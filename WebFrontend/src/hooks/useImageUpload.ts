import axiosInstance from '@/services/axiosInstance';

export const useImageUpload = () => {
  const getPresignedUrls = async (files: File[], refIn: string) => {
    const dto = {
      items: files.map((file) => ({
        refIn,
        fileType: file.type,
      })),
    };
    const res = await axiosInstance.post('/images/upload-urls', dto);
    return res.data as Record<string, { url: string; key: string }>;
  };

  const uploadToS3 = async (files: File[], uploadData: Record<string, { url: string }>, refIn: string) => {
    await Promise.all(
      files.map(async (file) => {
        const { url } = uploadData[refIn];
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
      }),
    );
  };

  const saveImgMetaData = async (uploadData: Record<string, { url: string; key: string }>, refIn: string, refPostId?: number) => {
    const payload = {
      images: Object.values(uploadData).map((data, idx) => ({
        imageUrl: `https://recho-img.s3.ap-northeast-2.amazonaws.com/${data.key}`,
        key: data.key,
        refIn,
        uploadOrder: idx,
        refPostId,
      })),
    };
    const res = await axiosInstance.post('/images', payload);
    return res.data.imageIds;
  };

  return { getPresignedUrls, uploadToS3, saveImgMetaData };
};
