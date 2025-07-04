import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import VinylContents from "../../components/organisms/vinyl/VinylContents";
import Navigation from "../../components/layout/Navigation";
import { getVideos } from "../../api";
import type { Video } from "../../types/video";

const SWIPE_VELOCITY_THRESHOLD = 500;
const DRAG_THRESHOLD = 100;

const VinylPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [videos, setVideos] = useState<Video[]>([]);

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
      const videoData = await getVideos(1, 10);
      setVideos(videoData);
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) {
      controls.start({
        x: -currentIndex * containerWidth,
        transition: { type: "tween", duration: 0.5, ease: "easeOut" },
      });
    }
  }, [currentIndex, containerWidth, controls, isDragging]);

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
    if (distance === 0) return 0;
    if (Math.abs(distance) === 1) return distance * 45;
    return distance * 0;
  };

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
        <motion.div
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          animate={controls}
          style={{ display: "flex", cursor: "grab" }}
        >
          {videos.map((video, index) => (
            <div
              key={index}
              style={{
                flex: "0 0 100%",
                minWidth: "100%",
              }}
            >
              <VinylContents
                likes={video.likes}
                comments={video.comments}
                videoInfo={video.videoInfo}
                videoSrc={video.videoUrl}
                isVisible={isCurrentlyVisible(index)}
                rotationAngle={getRotationAngle(index)}
              />
            </div>
          ))}
        </motion.div>
      </div>
      <Navigation />
    </>
  );
};

export default VinylPage;
