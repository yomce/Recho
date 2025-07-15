import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 라우터 파라미터 hook
import VinylContents from "../../components/organisms/vinyl/VinylContents";
import { getVideoById } from "../../api"; // 특정 ID의 비디오를 가져오는 API 함수
import type { Video } from "../../types/video";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/molecules/modal/Modal";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import Navigation from "@/components/layout/Navigation";

// 컴포넌트 이름을 VinylSpecificPage로 변경
const VinylSpecificPage: React.FC = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL에서 videoId 파라미터를 가져옴 (예: /vinyl/abc-123)
  const { videoId } = useParams<{ videoId: string }>();

  useEffect(() => {
    // 페이지 진입 시 스크롤을 막고, 이탈 시 해제
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const fetchVideo = async () => {
      // videoId가 유효한지 확인
      if (!videoId) {
        console.error("비디오 ID가 URL에 없습니다.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // videoId로 특정 비디오 데이터 요청
        const videoData = await getVideoById(videoId);
        setVideo(videoData);
      } catch (error) {
        console.error("비디오 로딩 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]); // videoId가 바뀔 때마다 비디오를 다시 불러옴

  const openModal = () => {
    if (video) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleStartEnsemble = () => {
    if (!video) {
      alert("합주할 비디오를 선택해주세요.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "startEnsemble",
          payload: {
            token,
            childVideoId: video.id,
          },
        }),
      );
      closeModal();
    } else {
      alert("React Native 환경에서만 합주하기가 가능합니다.");
    }
  };

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return <Loading />;
  }

  // 비디오 데이터가 없을 때 (에러 또는 존재하지 않는 ID)
  if (!video) {
    return (
      <div className="bg-black h-screen flex items-center justify-center text-white">
        비디오를 찾을 수 없습니다.
      </div>
    );
  }

  // 비디오 데이터가 성공적으로 로드됐을 때
  return (
    <>
      <div className="bg-black h-screen w-full overflow-hidden flex items-center justify-center">
        <VinylContents
          likes={video.like_count}
          comments={video.comment_count}
          videoInfo={video.id}
          videoSrc={video.video_url}
          isVisible={true}      // 항상 표시
          rotationAngle={0}       // 회전 없음
          depth={video.depth}
          onStartEnsemble={openModal}
        />
      </div>
      <Navigation />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="VINYL 합주하기">
        <div className="flex flex-col gap-3 mt-4">
          <p className="text-body text-brand-text-secondary mb-2">
            선택한 비디오에 합주할 새로운 영상을 추가합니다.
          </p>
          <PrimaryButton onClick={handleStartEnsemble}>
            갤러리에서 선택
          </PrimaryButton>
          <PrimaryButton onClick={() => alert("촬영하기")}>
            촬영하기
          </PrimaryButton>
          <SecondaryButton onClick={closeModal}>닫기</SecondaryButton>
        </div>
      </Modal>
    </>
  );
};

export default VinylSpecificPage;