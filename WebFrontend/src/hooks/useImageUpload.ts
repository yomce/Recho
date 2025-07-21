import axiosInstance from '@/services/axiosInstance';

export const useImageUpload = () => {
  const getPresignedUrls = async (files: File[], refIn: string) => {
    const dto = {
      items: files.flatMap((file) => [
        {
          refIn,
          fileType: file.type,
          isThumbnail: false,
          originalKey: `${refIn}-${file.name}-original`,
        },
        {
          refIn,
          fileType: 'image/jpeg', // 썸네일은 다운사이징 후 jpeg 고정
          isThumbnail: true,
          originalKey: `${refIn}-${file.name}-thumbnail`,
        },
      ]),
    };
    const res = await axiosInstance.post('/images/upload-urls', dto);
    return res.data as Record<string, { url: string; key: string }>;
  };

  const resizeImage = async (file: File): Promise<File> => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = 0.2; // 20% 크기로 축소
    canvas.width = imageBitmap.width * scale;
    canvas.height = imageBitmap.height * scale;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `thumb-${file.name}`, { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.8);
    });
  }

  const uploadToS3 = async (files: File[], uploadData: Record<string, { url: string }>, refIn: string) => {
    await Promise.all(
      files.map(async (file) => {

        const originalKey = `${refIn}-${file.name}-original`;
        const thumbnailKey = `${refIn}-${file.name}-thumbnail`;

        const originalEntry = uploadData[originalKey];
        const thumbEntry = uploadData[thumbnailKey];

        console.log('original:', originalEntry?.url); // 디버그
        console.log('thumb:', thumbEntry?.url); // 디버그

        const originalUpload = originalEntry ? fetch(originalEntry.url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        : Promise.resolve();

        const thumbFile = await resizeImage(file);
        const thumbUpload = thumbEntry ? fetch(thumbEntry.url, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: thumbFile,
        })
        : Promise.resolve();
        
        return [originalUpload, thumbUpload];
      })
    );
  };

  const saveImgMetaData = async (uploadData: Record<string, { url: string; key: string }>, refIn: string, refPostId?: number) => {
    const payload = {
      images: Object.values(uploadData).map((data, idx) => ({
        key: data.key,
        refIn,
        uploadOrder: idx,
        refPostId,
        isThumbnail: data.key.includes('/thumbnail/'),
      })),
    };
    const res = await axiosInstance.post('/images', payload);
    console.log("fe res:", res);
    return res.data.imageIds;
  };

  return { getPresignedUrls, uploadToS3, saveImgMetaData };
};
