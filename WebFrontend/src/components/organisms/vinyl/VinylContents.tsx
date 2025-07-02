import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface VinylContentsProps {
  likes: number;
  comments: number;
  videoInfo: string;
  videoSrc: string;
  isVisible: boolean; // 현재 화면에 보이는지 여부
  rotationAngle: number; // 회전 각도
}

const VinylContents: React.FC<VinylContentsProps> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controls = useAnimation();
  const [prevRotationAngle, setPrevRotationAngle] = useState(
    props.rotationAngle
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      // 화면에 보일 때만 재생
      if (props.isVisible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [props.isVisible]);

  useEffect(() => {
    // Start rotation animation first
    const rotationPromise = controls.start({
      rotate: props.rotationAngle,
      transition: { duration: 1.0, ease: "easeInOut" },
    });

    // When the item is centered (rotation becomes 0)
    if (props.rotationAngle === 0 && prevRotationAngle !== 0) {
      // After rotation finishes, trigger the "pop" animation
      rotationPromise.then(() => {
        controls.start({
          scale: [1, 0.95, 1], // Keyframes for the pop effect
          transition: { duration: 0.3 },
        });
      });
    } else {
      // For non-centered items, ensure the scale is reset to 1
      controls.start({ scale: 1 });
    }

    if (props.rotationAngle !== prevRotationAngle) {
      setPrevRotationAngle(props.rotationAngle);
    }
  }, [props.rotationAngle, prevRotationAngle, controls]);

  return (
    <motion.div
      style={{
        position: "relative",
        transformOrigin: "50% 300%", // 회전 축을 하단으로 설정
      }}
      animate={controls}
    >
      <video
        ref={videoRef}
        src={props.videoSrc}
        width="100%"
        controls={false}
        playsInline
        muted
        style={{ display: "block" }}
      />
      <div
        id="video_data"
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "10px",
        }}
      >
        <h1>{props.likes}</h1>
        <h1>{props.comments}</h1>
        <button>합주하기 소스:{props.videoInfo}</button>
      </div>
    </motion.div>
  );
};

export default VinylContents;
