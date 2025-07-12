import React, { useState } from "react";
import Icon from "../icon/Icon";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ImageUploadProps {
  refIn: string,
  refPostId?: number,
  maxImages?: number;
  onUploadComplete?: (images: { id: number; url: string }[]) => void;
}

const ImageUploadPreview: React.FC<ImageUploadProps> = ({ refIn, refPostId, maxImages = 5, onUploadComplete }) => {
  const [ images, setImages ] = useState<string[]>([]);
  const [ showModal, setShowModal ] = useState(false);

  const { getPresignedUrls, uploadToS3, saveImgMetaData } = useImageUpload();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, maxImages - images.length);
    
    if(files.length === 0)  return;

    try {
      // 1. Presigned URL 발급
      const uploadData = await getPresignedUrls(files, refIn);

      // 2. S3에 이미지 직접 업로드
      await uploadToS3(files, uploadData, refIn);

      console.log("업로드함");

      // 3. 이미지 메타데이터 서버 저장
      const imageIds = await saveImgMetaData(uploadData, refIn, refPostId);

      console.log("이미지id:",imageIds);

      // 4. 미리보기 UI 업데이트
      const previewUrls = files.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...previewUrls].slice(0, maxImages));
      setShowModal(false);

      // 여기서 부모로 id 배열 전달
      if (onUploadComplete) {
        const combined = (imageIds ?? []).map((id, index) => ({
          id,
          url: previewUrls[index],
        }));
        console.log("image upload preview:", combined);
        onUploadComplete(combined);
      }
    } catch(error) {
      console.error("이미지 업로드 오류:", error);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  return(
    <div className="flex gap-4 items-center">
      {/* 카메라 박스 */}
      <div className="w-[64px] h-[64px] border border-gray-300 bg-white rounded-lg flex flex-col items-center justify-center gap-1 text-caption">
        <Icon name="camera" size={20} className="text-brand-gray"/>
        <span className="text-footnote text-brand-gray">{images.length}/{maxImages}</span>
      </div>

      {/* 플러스 박스 */}
      <button
        onClick={() => setShowModal(true)}
        className="w-[64px] h-[64px] border border-gray-300 bg-white rounded-lg flex items-center justify-center"
      >
        <Icon name="plus" size={24} className="text-brand-gray"/>
      </button>

      {/* 이미지 미리보기 */}
      {images.map((src, idx) => (
        <div
          key={idx}
          className="w-[64px] h-[64px] rounded-lg overflow-hidden border border-gray-300 bg-white"
        >
          <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-sm text-center space-y-4">
            <p className="text-button">사진 업로드</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-caption border border-gray-200 px-3 py-2 rounded-[10px] bg-white gap-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:bg-brand-primary file:text-white"
            />
            <button
              onClick={() => setShowModal(false)}
              className="text-sm text-blue-500 hover:underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadPreview;