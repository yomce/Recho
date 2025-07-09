import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import VinylContents from "../../components/organisms/vinyl/VinylContents";
import { getVideos } from "../../api";
import type { Video } from "../../types/video";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/molecules/modal/Modal";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import Navigation from "@/components/layout/Navigation";

const SWIPE_VELOCITY_THRESHOLD = 500;
const DRAG_THRESHOLD = 100;

const VinylPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Lock body scroll when component mounts
    document.body.style.overflow = "hidden";
    // Unlock body scroll when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      // 5초 후 강제로 로딩을 종료하는 타임아웃 설정
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 7000);

      try {
        const videoData = await getVideos(1, 10);
        console.log("Fetched video data:", videoData);
        if (videoData.length === 0) {
          // 비디오가 없으면 바로 로딩 종료 및 타임아웃 해제
          if (loadingTimeoutRef.current)
            clearTimeout(loadingTimeoutRef.current);
          setIsLoading(false);
        }
        setVideos(videoData);
      } catch (error) {
        console.error("비디오 로딩 중 오류 발생:", error);
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false); // 에러 발생 시에도 로딩 종료 및 타임아웃 해제
      }
    };

    fetchVideos();

    // 컴포넌트 언마운트 시 타임아웃 해제
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isDragging) {
      controls.start({
        x: -currentIndex * containerWidth,
        transition: { type: "tween", duration: 0.5, ease: "easeOut" },
      });
    }
  }, [currentIndex, containerWidth, controls, isDragging]);

  const handleFirstVideoReady = () => {
    // 비디오가 준비되면 타임아웃을 해제하고 로딩 상태를 false로 변경
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(false);
  };

  const openModal = (videoId: string) => {
    setSelectedVideoId(videoId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideoId(null);
  };

  const handleStartEnsemble = () => {
    if (!selectedVideoId) {
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
            childVideoId: selectedVideoId,
          },
        })
      );
      closeModal();
    } else {
      alert("React Native 환경에서만 합주하기가 가능합니다.");
    }
  };

  const handlePan = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (Math.abs(info.offset.x) > DRAG_THRESHOLD) {
      setIsDragging(true);
      const dragOffset =
        info.offset.x > 0
          ? info.offset.x - DRAG_THRESHOLD
          : info.offset.x + DRAG_THRESHOLD;
      controls.set({
        x: -currentIndex * containerWidth + dragOffset,
      });
    }
  };

  const handlePanEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const { offset, velocity } = info;

    const swipeVelocity = Math.abs(velocity.x);
    const dragDistance = Math.abs(offset.x);

    let nextIndex = currentIndex;

    if (
      swipeVelocity > SWIPE_VELOCITY_THRESHOLD ||
      dragDistance > DRAG_THRESHOLD
    ) {
      if (offset.x < 0) {
        nextIndex = Math.min(videos.length - 1, currentIndex + 1);
      } else {
        nextIndex = Math.max(0, currentIndex - 1);
      }
    }

    setCurrentIndex(nextIndex);
  };

  const isCurrentlyVisible = (index: number) => index === currentIndex;

  const getRotationAngle = (index: number) => {
    const distance = index - currentIndex;
    // 거리에 비례하여 30도씩 부드럽게 회전하도록 수정
    return distance * 30;
  };

  const RENDER_BUFFER = 2;
  const renderWindowStart = Math.max(0, currentIndex - RENDER_BUFFER);
  // `slice` 대신 인덱스 비교를 위해 마지막 인덱스를 정확히 계산
  const renderWindowEnd = Math.min(
    videos.length - 1,
    currentIndex + RENDER_BUFFER
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {isLoading && <Loading />}
      <div
        className=" bg-black h-screen "
        ref={containerRef}
        style={{
          width: "100%",
          overflow: "hidden",
        }}
      >
        <motion.div
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          animate={controls}
          style={{ display: "flex", cursor: "grab" }}
        >
          {videos.map((video, index) => {
            // 렌더링 창 내에 있는지 확인
            const isWithinRenderWindow =
              index >= renderWindowStart && index <= renderWindowEnd;
            return (
              <div
                key={index}
                style={{
                  flex: "0 0 100%",
                  minWidth: "100%",
                  // 컴포넌트를 DOM에서 제거하는 대신 보이지 않게 처리
                  display: isWithinRenderWindow ? "block" : "none",
                }}
              >
                <VinylContents
                  likes={video.like_count}
                  comments={video.comment_count}
                  videoInfo={video.id}
                  videoSrc={video.video_url}
                  isVisible={isCurrentlyVisible(index)}
                  rotationAngle={getRotationAngle(index)}
                  depth={video.depth}
                  onStartEnsemble={() => openModal(video.id)}
                  onVideoReady={index === 0 ? handleFirstVideoReady : undefined}
                />
              </div>
            );
          })}
        </motion.div>
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

export default VinylPage;
