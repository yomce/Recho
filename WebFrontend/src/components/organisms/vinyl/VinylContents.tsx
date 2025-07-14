import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import type { User } from '@/stores/authStore';
import VinylRightLayout from '@/components/layout/pages/vinyl/VinylRightLayout';
import ProfileWithName from '@/components/atoms/button/ProfileWithName';

interface VinylContentsProps {
  videoOwner: User;
  size: {width: number, height: number};
  likes: number;
  comments: number;
  videoInfo: string;
  videoSrc: string;
  isVisible: boolean; // 현재 화면에 보이는지 여부
  rotationAngle: number; // 회전 각도
  depth: number; // depth prop 추가
  onVideoReady?: () => void; // 비디오 로딩 완료 콜백
  onStartEnsemble: (videoId: string) => void; // prop 타입 정의 추가
}

const VinylContents: React.FC<VinylContentsProps> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controls = useAnimation();
  const [prevRotationAngle, setPrevRotationAngle] = useState(
    props.rotationAngle
  );
  const [isPlaying, setIsPlaying] = useState(false); // 비디오 재생 상태 관리

  const [divHeight, setDivHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      const height = props.size.width * 16 / 9;
      setDivHeight(height);
    };

    updateHeight(); // 초기값 설정
    window.addEventListener("resize", updateHeight); // 리사이즈 대응

    return () => window.removeEventListener("resize", updateHeight);
  }, [props.size.width]);

  const handleVideoCanPlay = () => {
    // 비디오가 재생 준비되면 재생 시도
    if (videoRef.current && props.isVisible) {
      videoRef.current.play().catch((error) => {
        console.log("자동 재생 실패. 사용자의 상호작용이 필요합니다.", error);
      });
      setIsPlaying(true); // 재생 시작 시 상태 업데이트
    }
    // 부모 컴포넌트에게 로딩 완료 알림 (필요한 경우)
    if (props.onVideoReady) {
      props.onVideoReady();
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((error) => {
          console.log("재생 실패:", error);
        });
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = true;
      if (props.isVisible) {
        // 화면에 보일 때 비디오 로드를 시작 (재생은 onCanPlay에서)
        videoRef.current.load();
        // isPlaying 상태를 true로 초기화하여 다음 렌더링 시 재생되도록 준비
        setIsPlaying(true); 
      } else {
        // 보이지 않으면 일시정지하고 시간 리셋
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false); // 일시정지 시 상태 업데이트
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
        width: "100%",
        height: `${divHeight}px`,
      }}
      animate={controls}
    >
      <video
        ref={videoRef}
        src={props.videoSrc}
        width="100%"
        controls={false}
        playsInline
        crossOrigin="anonymous"
        style={{ 
          display: "block",
        }}
        onCanPlay={handleVideoCanPlay}
        onClick={handleVideoClick}
      />

        {/* --- 왼쪽 위 프로필 및 구독 버튼 추가 --- */}
    <div
      style={{
        position: "absolute",
        top: `${divHeight * 0.84}px`,
        left: "24px",
        display: "flex",
        alignItems: "center",
        gap: "8px", // 아이콘과 버튼 사이 간격
        zIndex: 10,
      }}
    >
        <ProfileWithName
          user={props.videoOwner}
        />
      </div>

      <VinylRightLayout
        likes={props.likes}
        comments={props.comments}
        divHeight={divHeight}
      />
      
      {/* 버튼은 비디오 위에, 중앙에 위치 */}
      {!isPlaying && props.depth < 6 && (
        <PrimaryButton
          onClick={() => props.onStartEnsemble(props.videoInfo)}
          style={{
            width: "50%",
            position: "absolute",
            bottom: "8px",
            boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.3)",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10, // 다른 요소 위에 오도록 z-index 설정
          }}
        >
          합주하기
        </PrimaryButton>
      )}
    </motion.div>
  );
};

export default VinylContents;