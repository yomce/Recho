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
import { useSizeStore } from "@/stores/sizeStore";
import { useVinylStore } from "@/stores/vinylStore";

const SWIPE_VELOCITY_THRESHOLD = 500;
const DRAG_THRESHOLD = 100;

const VinylPage: React.FC = () => {
  const { currentIndex, setCurrentIndex } = useVinylStore(); // 화면 전환 시 이전에 봤던 영상들이 다 보임
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 안드로이드 터치 이벤트를 위한 상태
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const globalSize = useSizeStore();

  useEffect(() => {
    // Lock body scroll when component mounts
    document.body.style.overflow = "hidden";
    // Unlock body scroll when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (isLoading || !containerRef.current) {
      return;
    }
    const element = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        // 2. React의 setState 대신 Zustand의 setSize 사용
        useSizeStore.getState().setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, [isLoading]);

  useEffect(() => {
  const fetchVideosUpToIndex = async () => {
    setIsLoading(true);
    try {
      // 1. Zustand 스토어에서 저장된 currentIndex를 직접 가져옵니다.
      const initialIndex = useVinylStore.getState().currentIndex;

      // 2. 해당 인덱스를 포함하기 위해 몇 페이지를 로드해야 하는지 계산합니다. (최소 1페이지)
      const pagesToLoad = Math.max(1, Math.ceil((initialIndex + 1) / 5));
      
      const allVideos: Video[] = [];

      // 3. 필요한 모든 페이지의 비디오를 순차적으로 불러옵니다.
      for (let i = 1; i <= pagesToLoad; i++) {
        const videoData = await getVideos(i, 5);
        if (videoData.length > 0) {
          allVideos.push(...videoData);
        }
        // 만약 비디오를 5개 미만으로 받아왔다면, 더 이상 데이터가 없는 것이므로 중단합니다.
        if (videoData.length < 5) {
          setHasMore(false);
          break;
        }
      }

      // 4. 불러온 모든 비디오로 상태를 설정하고, 현재 페이지 번호도 업데이트합니다.
      setVideos(allVideos);
      setPage(pagesToLoad);

    } catch (error) {
      console.error("비디오 로딩 중 오류 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchVideosUpToIndex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 이 로직은 페이지가 마운트될 때 한 번만 실행되어야 합니다.

  const loadMoreVideos = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const newVideos = await getVideos(nextPage, 5);
      if (newVideos.length > 0) {
        setVideos((prevVideos) => [...prevVideos, ...newVideos]);
        setPage(nextPage);
      } else {
        setHasMore(false); // 더 이상 비디오가 없음을 표시
      }
    } catch (error) {
      console.error("추가 비디오 로딩 중 오류 발생:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    // 현재 인덱스가 5의 배수이고(인덱스 4, 9, 14...), 현재 로드된 비디오의 마지막에 도달했을 때
    if (
      (currentIndex + 1) % 5 === 0 &&
      currentIndex > 0 &&
      currentIndex + 1 === videos.length &&
      hasMore &&
      !isFetchingMore
    ) {
      loadMoreVideos();
    }
  }, [currentIndex, videos.length, hasMore, isFetchingMore]);

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
    // 비디오가 준비되면 로딩 상태를 false로 변경
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
          data: {
            token,
            selectedVideoId: selectedVideoId,
          },
        })
      );
      closeModal();
    } else {
      alert("React Native 환경에서만 합주하기가 가능합니다.");
    }
  };

  const handleStartRecording = () => {
    if (!selectedVideoId) {
      alert("촬영할 비디오를 선택해주세요.");
      return;
    }

    const video = videos.find((v) => v.id === selectedVideoId);
    if (!video) {
      alert("선택된 비디오 정보를 찾을 수 없습니다.");
      closeModal();
      return;
    }

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "startRecording",
          data: {
            video: video,
          },
        })
      );
      closeModal();
    } else {
      alert("React Native 환경에서만 촬영하기가 가능합니다.");
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

  // 안드로이드용 네이티브 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > DRAG_THRESHOLD;
    const isRightSwipe = distance < -DRAG_THRESHOLD;

    if (isLeftSwipe && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const isCurrentlyVisible = (index: number) => index === currentIndex;

  const getRotationAngle = (index: number) => {
    const distance = index - currentIndex;
    return distance * 30;
  };

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
          onPanStart={() => setIsDragging(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          animate={controls}
          style={{ display: "flex", cursor: "grab" }}
        >
          {videos.map((video, index) => {
            return (
              <div
                key={index}
                style={{
                  flex: "0 0 100%",
                  minWidth: "100%",
                }}
              >
                <VinylContents
                  currentVideo={video}
                  size={globalSize}
                  isVisible={isCurrentlyVisible(index)}
                  rotationAngle={getRotationAngle(index)}
                  depth={video.depth}
                  onStartEnsemble={() => openModal(video.id)}
                  onVideoReady={index === 0 ? handleFirstVideoReady : undefined}
                  setVideos={setVideos}
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
          <PrimaryButton onClick={handleStartRecording}>촬영하기</PrimaryButton>
          <SecondaryButton onClick={closeModal}>닫기</SecondaryButton>
        </div>
      </Modal>
    </>
  );
};

export default VinylPage;
