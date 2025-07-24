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

    const MAX_SIZE_KB = 90;
    const TARGET_WIDTH = 400;
    // 원본이 이미 작을 경우: 리사이즈 하지 않고 그대로 반환
    if (imageBitmap.width <= TARGET_WIDTH && imageBitmap.height <= TARGET_WIDTH) {
      return file;
    }
    
    // 비율 유지하며 TARGET_WIDTH 이하로 리사이징할 비율 계산 (화질 개선을 위해 정수값의 픽셀 전달)
    const scale = Math.min(TARGET_WIDTH / imageBitmap.width, TARGET_WIDTH / imageBitmap.height);
    const targetWidth = Math.round(imageBitmap.width * scale);
    const targetHeight = Math.round(imageBitmap.height * scale);

    // 캔버스를 통해 이미지 리사이징
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;       // 안티앨리어싱 활성화
    ctx.imageSmoothingQuality = 'high';     // 고화질 리사이징 설정

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const sizeKB = blob.size / 1024;
          if (sizeKB > MAX_SIZE_KB) {
            // 용량 제한을 초과한 경우 로그 출력 (필요시 여기서 재압축 로직 가능)
            console.warn(`썸네일이 ${sizeKB.toFixed(1)}KB로 ${MAX_SIZE_KB}KB를 초과함`);
          }
          resolve(new File([blob], `thumb-${file.name}`, { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.95);
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
