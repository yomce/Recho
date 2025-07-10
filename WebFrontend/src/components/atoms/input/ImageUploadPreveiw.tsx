import React, { useState } from "react";
import Icon from "../icon/Icon";

interface ImageUploadProps {
  maxImages?: number;
}

const ImageUploadPreview: React.FC<ImageUploadProps> = ({ maxImages = 5 }) => {
  const [ images, setImages ] = useState<string[]>([]);
  const [ showModal, setShowModal ] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileUrl = files.map((file) => URL.createObjectURL(file));

    console.log("업로드된 파일:", files);
    console.log("생성된 미리보기 URL:", fileUrl);

    setImages((prev) => [...prev, ...fileUrl].slice(0, maxImages));
    setShowModal(false);
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